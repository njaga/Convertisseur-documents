import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Accept } from 'react-dropzone';
import { Download, FileArchive, Image as ImageIcon, Loader2, RotateCw, Video, X } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import FilePreview from '../components/FilePreview';
import ResultPreview from '../components/ResultPreview';
import { compressPdf, compressVideo, ImageEditOptions, processImage, QualityPreset, savings } from '../services/optimizer';
import { createZip } from '../services/zip';

type Mode = 'image' | 'pdf' | 'video';
const defaults: ImageEditOptions = { rotation: 0, flipX: false, flipY: false, quality: 'balanced', background: 'transparent', crop: { x: 0, y: 0, width: 100, height: 100 }, format: 'webp' };
const modes = [
  { id: 'pdf', path: '/compresser-pdf', label: 'PDF', title: 'Compresser PDF', description: 'Réduisez la taille de vos fichiers PDF tout en choisissant le niveau de qualité adapté.', icon: FileArchive },
  { id: 'image', path: '/optimiser-images', label: 'Images', title: 'Optimiser des images', description: 'Redimensionnez, convertissez et compressez vos images directement dans le navigateur.', icon: ImageIcon },
  { id: 'video', path: '/compresser-video', label: 'Vidéos', title: 'Compresser une vidéo', description: 'Réduisez le poids de vos vidéos avec un profil adapté au partage ou au stockage.', icon: Video },
] as const;

const accepts: Record<Mode, Accept> = {
  image: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.ico'] },
  pdf: { 'application/pdf': ['.pdf'] },
  video: { 'video/*': ['.mp4', '.webm', '.avi', '.mkv', '.mov'] },
};

const presets: Array<{ id: QualityPreset; label: string; description: string }> = [
  { id: 'high', label: 'Qualité élevée', description: 'Réduction légère, rendu plus proche de l’original.' },
  { id: 'balanced', label: 'Équilibré', description: 'Bon compromis entre qualité visuelle et taille.' },
  { id: 'small', label: 'Taille minimale', description: 'Compression plus forte pour obtenir le fichier le plus léger.' },
];

const pathToMode = new Map<string, Mode>(modes.map(item => [item.path, item.id]));
const isMode = (value: string | null): value is Mode => value === 'image' || value === 'pdf' || value === 'video';

export default function OptimizeTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedMode = pathToMode.get(location.pathname) ?? searchParams.get('type');
  const mode: Mode = isMode(requestedMode) ? requestedMode : 'pdf';
  const modeInfo = modes.find(item => item.id === mode) ?? modes[0];
  const accept = accepts[mode];

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

  useEffect(() => {
    const previousTitle = document.title;
    const existingMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const meta = existingMeta ?? document.head.appendChild(document.createElement('meta'));
    const previousDescription = meta.getAttribute('content');
    if (!existingMeta) meta.name = 'description';

    const existingCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonical = existingCanonical ?? document.head.appendChild(document.createElement('link'));
    const previousCanonical = canonical.getAttribute('href');
    if (!existingCanonical) canonical.rel = 'canonical';

    document.title = `${modeInfo.title} gratuitement | Doxali`;
    meta.setAttribute('content', `${modeInfo.description} Outil gratuit, sans inscription et avec traitement local en priorité.`);
    canonical.setAttribute('href', `${window.location.origin}${modeInfo.path}`);

    return () => {
      document.title = previousTitle;
      if (existingMeta) {
        if (previousDescription === null) meta.removeAttribute('content');
        else meta.setAttribute('content', previousDescription);
      } else meta.remove();

      if (existingCanonical) {
        if (previousCanonical === null) canonical.removeAttribute('href');
        else canonical.setAttribute('href', previousCanonical);
      } else canonical.remove();
    };
  }, [modeInfo]);

  const clearResults = () => {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current.length = 0;
    setResults([]);
  };

  const changeMode = (next: Mode) => {
    clearResults();
    setFiles([]);
    setProgress(0);
    const destination = modes.find(item => item.id === next)?.path ?? '/compresser-pdf';
    navigate(destination);
  };

  const addFiles = (selected: File[]) => {
    clearResults();
    setFiles(current => [...current, ...selected].filter((file, index, all) =>
      all.findIndex(candidate => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index
    ));
  };

  const removeFile = (index: number) => {
    clearResults();
    setFiles(current => current.filter((_, fileIndex) => fileIndex !== index));
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
          const url = await compressVideo(file, preset, value => setProgress(Math.round((index + value / 100) / files.length * 100)));
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
    anchor.href = url;
    anchor.download = 'fichiers-optimises.zip';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const uploadTitle = mode === 'pdf' ? 'Sélectionner les fichiers PDF' : mode === 'image' ? 'Sélectionner les images' : 'Sélectionner les vidéos';
  const uploadHint = mode === 'pdf'
    ? 'ou glissez-déposez vos PDF ici · 150 MB max. par fichier'
    : mode === 'image'
      ? 'ou glissez-déposez vos images ici · PNG, JPG, WebP ou ICO'
      : 'ou glissez-déposez vos vidéos ici · MP4, WebM, AVI, MKV ou MOV';

  const actionLabel = mode === 'pdf' ? 'Compresser les PDF' : mode === 'image' ? 'Optimiser les images' : 'Compresser les vidéos';

  return (
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">{modeInfo.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">{modeInfo.description}</p>
        </header>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {modes.map(item => (
            <button key={item.id} type="button" onClick={() => changeMode(item.id)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === item.id ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950'}`}>
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-3xl">
          {files.length === 0 && <FileDropZone onFiles={addFiles} accept={accept} multiple title={uploadTitle} hint={uploadHint} />}
        </div>

        {files.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 md:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-950">Fichiers à traiter</h2>
                  <p className="mt-1 text-xs text-gray-500">{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</p>
                </div>
                <button type="button" onClick={() => { clearResults(); setFiles([]); }} className="text-sm font-medium text-red-600 hover:text-red-700">Tout retirer</button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {files.map((file, index) => (
                  <article key={`${file.name}-${file.size}-${file.lastModified}`} className="relative rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <button type="button" onClick={() => removeFile(index)} aria-label={`Retirer ${file.name}`} className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 text-gray-500 shadow-sm hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                    <FilePreview file={file} />
                    <p className="mt-3 truncate pr-7 text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </article>
                ))}
              </div>

              <div className="mt-4">
                <FileDropZone onFiles={addFiles} accept={accept} multiple title="Ajouter d’autres fichiers" hint="Cliquez ou glissez-déposez d’autres fichiers ici" />
              </div>

              {mode === 'image' && (
                <div className="mt-6 grid gap-4 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-sm">Largeur<input type="number" min="1" value={options.width ?? ''} onChange={event => setOptions(current => ({ ...current, width: Number(event.target.value) || undefined }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Automatique" /></label>
                  <label className="text-sm">Hauteur<input type="number" min="1" value={options.height ?? ''} onChange={event => setOptions(current => ({ ...current, height: Number(event.target.value) || undefined }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Proportionnelle" /></label>
                  <label className="text-sm">Format<select value={options.format} onChange={event => setOptions(current => ({ ...current, format: event.target.value as ImageEditOptions['format'] }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="webp">WebP</option><option value="jpeg">JPG</option><option value="png">PNG</option></select></label>
                  <label className="text-sm">Qualité<select value={options.quality} onChange={event => setOptions(current => ({ ...current, quality: event.target.value as QualityPreset }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="high">Élevée</option><option value="balanced">Équilibrée</option><option value="small">Taille minimale</option></select></label>
                  <label className="text-sm">Recadrage X %<input type="range" min="0" max="80" value={options.crop.x} onChange={event => setOptions(current => ({ ...current, crop: { ...current.crop, x: Number(event.target.value) } }))} className="mt-2 w-full" /></label>
                  <label className="text-sm">Recadrage Y %<input type="range" min="0" max="80" value={options.crop.y} onChange={event => setOptions(current => ({ ...current, crop: { ...current.crop, y: Number(event.target.value) } }))} className="mt-2 w-full" /></label>
                  <button type="button" onClick={() => setOptions(current => ({ ...current, rotation: ((current.rotation + 90) % 360) as ImageEditOptions['rotation'] }))} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><RotateCw size={15} /> Rotation {options.rotation}°</button>
                  <div className="flex gap-2"><button type="button" onClick={() => setOptions(current => ({ ...current, flipX: !current.flipX }))} className={`flex-1 rounded-lg border px-2 py-2 text-sm ${options.flipX ? 'bg-gray-950 text-white' : 'bg-white'}`}>Miroir H</button><button type="button" onClick={() => setOptions(current => ({ ...current, flipY: !current.flipY }))} className={`flex-1 rounded-lg border px-2 py-2 text-sm ${options.flipY ? 'bg-gray-950 text-white' : 'bg-white'}`}>Miroir V</button></div>
                  <label className="text-sm">Fond<select value={options.background} onChange={event => setOptions(current => ({ ...current, background: event.target.value as ImageEditOptions['background'] }))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="transparent">Transparent</option><option value="white">Blanc</option></select></label>
                </div>
              )}

              {mode !== 'image' && (
                <div className="mt-7">
                  <p className="mb-3 text-sm font-semibold text-gray-800">Niveau d’optimisation</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {presets.map(item => (
                      <button key={item.id} type="button" onClick={() => setPreset(item.id)} className={`rounded-2xl border p-4 text-left transition ${preset === item.id ? 'border-gray-950 bg-gray-950 text-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className={`mt-1.5 block text-xs leading-5 ${preset === item.id ? 'text-gray-300' : 'text-gray-500'}`}>{item.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button disabled={!files.length || busy} onClick={() => void run()} className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300">
                {busy ? <><Loader2 size={17} className="animate-spin" /> Traitement {progress}%</> : actionLabel}
              </button>
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="font-semibold text-gray-950">Résultats</h2><p className="mt-1 text-xs text-gray-500">Vérifiez visuellement le résultat et comparez la taille avant/après.</p></div>
              {results.length > 1 && <button type="button" onClick={() => void downloadZip()} className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-medium text-white">Télécharger en ZIP</button>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map(result => (
                <article key={result.url} className="rounded-2xl border border-gray-200 p-4">
                  <p className="truncate font-medium text-gray-900">{result.name}</p>
                  <div className="mt-3"><ResultPreview url={result.url} name={result.name} /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-gray-50 p-2"><strong className="block text-sm">{(result.before / 1024 / 1024).toFixed(2)} MB</strong>Avant</div>
                    <div className="rounded-xl bg-gray-50 p-2"><strong className="block text-sm">{(result.after / 1024 / 1024).toFixed(2)} MB</strong>Après</div>
                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><strong className="block text-sm">{savings(result.before, result.after)}%</strong>Économie</div>
                  </div>
                  {result.dimensions && <p className="mt-2 text-xs text-gray-500">{result.dimensions}</p>}
                  <a href={result.url} download={result.name} className="mt-3 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold"><Download size={15} /> Télécharger</a>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
