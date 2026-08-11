import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileArchive, Image as ImageIcon, Loader2, RotateCw, Video } from 'lucide-react';
import FilePreview from '../components/FilePreview';
import { compressPdf, compressVideo, ImageEditOptions, processImage, QualityPreset, savings } from '../services/optimizer';
import { createZip } from '../services/zip';

type Mode = 'image' | 'pdf' | 'video';
const defaults: ImageEditOptions = { rotation: 0, flipX: false, flipY: false, quality: 'balanced', background: 'transparent', crop: { x: 0, y: 0, width: 100, height: 100 }, format: 'webp' };

export default function OptimizeTools() {
  const [mode, setMode] = useState<Mode>('image');
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState(defaults);
  const [preset, setPreset] = useState<QualityPreset>('balanced');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ name: string; url: string; before: number; after: number; dimensions?: string }>>([]);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const values = urls.current;
    return () => values.forEach(URL.revokeObjectURL);
  }, []);

  const accept = useMemo(() => mode === 'image' ? 'image/*,.ico' : mode === 'pdf' ? '.pdf,application/pdf' : 'video/*', [mode]);
  const clearResults = () => {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current.length = 0;
    setResults([]);
  };

  const run = async () => {
    if (!files.length) return;
    clearResults();
    setBusy(true);
    setProgress(5);
    try {
      const next = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (mode === 'image') {
          const output = await processImage(file, options);
          const url = URL.createObjectURL(output.blob);
          urls.current.push(url);
          next.push({ name: `${file.name.replace(/\.[^.]+$/, '')}.${options.format === 'jpeg' ? 'jpg' : options.format}`, url, before: file.size, after: output.blob.size, dimensions: `${output.width} × ${output.height}` });
        } else if (mode === 'pdf') {
          const blob = await compressPdf(file, preset, value => setProgress(Math.round((index + value / 100) / files.length * 100)));
          const url = URL.createObjectURL(blob);
          urls.current.push(url);
          next.push({ name: `${file.name.replace(/\.pdf$/i, '')}-optimise.pdf`, url, before: file.size, after: blob.size });
        } else {
          const url = await compressVideo(file, preset, value => setProgress(value));
          const blob = await fetch(url).then(response => response.blob());
          urls.current.push(url);
          next.push({ name: `${file.name.replace(/\.[^.]+$/, '')}-compresse.${preset === 'small' ? 'webm' : 'mp4'}`, url, before: file.size, after: blob.size });
        }
        setProgress(Math.round((index + 1) / files.length * 100));
      }
      setResults(next);
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    const entries = await Promise.all(results.map(async result => ({ name: result.name, blob: await fetch(result.url).then(response => response.blob()) })));
    const blob = await createZip(entries);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'fichiers-optimises.zip'; anchor.click();
    URL.revokeObjectURL(url);
  };

  return <main className="flex-grow px-6 pb-20 pt-28"><div className="mx-auto max-w-6xl">
    <div className="mb-8 text-center"><h1 className="text-4xl font-bold tracking-tight text-gray-900">Compression & édition</h1><p className="mt-3 text-gray-500">Optimisez vos fichiers localement et comparez le résultat avant téléchargement.</p></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {([{ id: 'image', label: 'Images', icon: ImageIcon }, { id: 'pdf', label: 'PDF', icon: FileArchive }, { id: 'video', label: 'Vidéos', icon: Video }] as const).map(item => <button key={item.id} onClick={() => { setMode(item.id); setFiles([]); clearResults(); }} className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-medium ${mode === item.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white'}`}><item.icon size={18} />{item.label}</button>)}
    </div>
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-8 text-center hover:border-gray-400"><input type="file" multiple className="hidden" accept={accept} onChange={event => setFiles(Array.from(event.target.files ?? []))} /><p className="font-medium">Ajouter un ou plusieurs fichiers</p><p className="mt-1 text-sm text-gray-500">Les mêmes réglages seront appliqués à tout le lot.</p></label>
      {files.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{files.map(file => <div key={`${file.name}-${file.size}`} className="rounded-xl border border-gray-200 p-3"><FilePreview file={file} /><p className="mt-2 truncate text-sm font-medium">{file.name}</p></div>)}</div>}

      {mode === 'image' && <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Largeur<input type="number" min="1" value={options.width ?? ''} onChange={event => setOptions(current => ({ ...current, width: Number(event.target.value) || undefined }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Automatique" /></label>
        <label className="text-sm">Hauteur<input type="number" min="1" value={options.height ?? ''} onChange={event => setOptions(current => ({ ...current, height: Number(event.target.value) || undefined }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Proportionnelle" /></label>
        <label className="text-sm">Format<select value={options.format} onChange={event => setOptions(current => ({ ...current, format: event.target.value as ImageEditOptions['format'] }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="webp">WebP</option><option value="jpeg">JPG</option><option value="png">PNG</option></select></label>
        <label className="text-sm">Qualité<select value={options.quality} onChange={event => setOptions(current => ({ ...current, quality: event.target.value as QualityPreset }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="high">Élevée</option><option value="balanced">Équilibrée</option><option value="small">Taille minimale</option></select></label>
        <label className="text-sm">Recadrage X %<input type="range" min="0" max="80" value={options.crop.x} onChange={event => setOptions(current => ({ ...current, crop: { ...current.crop, x: Number(event.target.value) } }))} className="mt-2 w-full" /></label>
        <label className="text-sm">Recadrage Y %<input type="range" min="0" max="80" value={options.crop.y} onChange={event => setOptions(current => ({ ...current, crop: { ...current.crop, y: Number(event.target.value) } }))} className="mt-2 w-full" /></label>
        <button onClick={() => setOptions(current => ({ ...current, rotation: ((current.rotation + 90) % 360) as ImageEditOptions['rotation'] }))} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><RotateCw size={15} /> Rotation {options.rotation}°</button>
        <div className="flex gap-2"><button onClick={() => setOptions(current => ({ ...current, flipX: !current.flipX }))} className={`flex-1 rounded-lg border px-2 py-2 text-sm ${options.flipX ? 'bg-gray-900 text-white' : 'bg-white'}`}>Miroir H</button><button onClick={() => setOptions(current => ({ ...current, flipY: !current.flipY }))} className={`flex-1 rounded-lg border px-2 py-2 text-sm ${options.flipY ? 'bg-gray-900 text-white' : 'bg-white'}`}>Miroir V</button></div>
        <label className="text-sm">Fond<select value={options.background} onChange={event => setOptions(current => ({ ...current, background: event.target.value as ImageEditOptions['background'] }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="transparent">Transparent</option><option value="white">Blanc</option></select></label>
      </div>}
      {mode !== 'image' && <div className="mt-6"><p className="mb-2 text-sm font-medium">Niveau d’optimisation</p><div className="flex gap-2">{(['high','balanced','small'] as const).map(value => <button key={value} onClick={() => setPreset(value)} className={`rounded-lg border px-4 py-2 text-sm ${preset === value ? 'bg-gray-900 text-white' : 'bg-white'}`}>{value === 'high' ? 'Qualité élevée' : value === 'balanced' ? 'Équilibré' : 'Taille minimale'}</button>)}</div></div>}
      <button disabled={!files.length || busy} onClick={() => void run()} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 font-medium text-white disabled:bg-gray-300">{busy ? <><Loader2 size={17} className="animate-spin" /> Traitement {progress}%</> : 'Optimiser les fichiers'}</button>
    </div>
    {results.length > 0 && <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Résultats et comparaison</h2>{results.length > 1 && <button onClick={() => void downloadZip()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">Télécharger en ZIP</button>}</div><div className="grid gap-4 sm:grid-cols-2">{results.map(result => <article key={result.url} className="rounded-xl border border-gray-200 p-4"><p className="truncate font-medium">{result.name}</p><div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-gray-50 p-2"><strong className="block text-sm">{(result.before/1024/1024).toFixed(2)} MB</strong>Avant</div><div className="rounded-lg bg-gray-50 p-2"><strong className="block text-sm">{(result.after/1024/1024).toFixed(2)} MB</strong>Après</div><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><strong className="block text-sm">{savings(result.before,result.after)}%</strong>Économie</div></div>{result.dimensions && <p className="mt-2 text-xs text-gray-500">{result.dimensions}</p>}<a href={result.url} download={result.name} className="mt-3 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"><Download size={15} /> Télécharger</a></article>)}</div></section>}
  </div></main>;
}
