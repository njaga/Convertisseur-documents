import { useEffect, useRef, useState } from 'react';
import { Download, Eye, Loader2, Play, RefreshCw, Share2, Square, Trash2 } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import FilePreview from '../components/FilePreview';
import ResultPreview from '../components/ResultPreview';
import { convertFile } from '../services/conversionService';
import { cancelActiveMediaConversion } from '../services/mediaConverter';
import { createZip } from '../services/zip';
import { estimateWork, explainError, saveHistory } from '../services/history';
import { getAvailableOutputFormats, getFileTypeFromExtension } from '../utils/formats';

type Status = 'ready' | 'processing' | 'completed' | 'error' | 'cancelled';
interface Item { id: string; file: File; output: string; customName: string; status: Status; progress: number; url?: string; error?: string; }

export default function BatchManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState('');
  const [naming, setNaming] = useState<'converted' | 'original' | 'custom'>('converted');
  const cancelled = useRef(false);
  const urls = useRef<string[]>([]);
  const estimate = estimateWork(items.map(item => item.file));

  useEffect(() => {
    const values = urls.current;
    return () => values.forEach(URL.revokeObjectURL);
  }, []);

  const addFiles = (files: File[]) => {
    const supported: Item[] = [];
    let ignored = 0;
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const formats = getAvailableOutputFormats(ext);
      if (!formats.length) {
        ignored += 1;
        continue;
      }
      supported.push({
        id: crypto.randomUUID(),
        file,
        output: formats[0].extension,
        customName: file.name.replace(/\.[^.]+$/, ''),
        status: 'ready',
        progress: 0,
      });
    }
    setSelectionWarning(ignored ? `${ignored} fichier${ignored > 1 ? 's' : ''} ignoré${ignored > 1 ? 's' : ''} car aucun format de sortie compatible n’est disponible.` : '');
    setItems(current => [...current, ...supported]);
  };

  const outputName = (item: Item) => {
    const base = item.file.name.replace(/\.[^.]+$/, '');
    const name = naming === 'original' ? base : naming === 'custom' ? item.customName : `${base}-converti`;
    return `${name}.${item.output}`;
  };

  const forgetUrl = (url?: string) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    urls.current = urls.current.filter(value => value !== url);
  };

  const convertOne = async (item: Item) => {
    forgetUrl(item.url);
    setItems(current => current.map(value => value.id === item.id ? { ...value, status: 'processing', progress: 0, error: undefined, url: undefined } : value));
    try {
      const url = await convertFile(item.file, item.output, progress => setItems(current => current.map(value => value.id === item.id ? { ...value, progress } : value)));
      if (cancelled.current) {
        URL.revokeObjectURL(url);
        setItems(current => current.map(value => value.id === item.id ? { ...value, status: 'cancelled' } : value));
        return;
      }
      urls.current.push(url);
      const resultBlob = await fetch(url).then(response => response.blob());
      await saveHistory(outputName(item), `${item.file.name} → ${item.output}`, resultBlob).catch(() => undefined);
      setItems(current => current.map(value => value.id === item.id ? { ...value, status: 'completed', progress: 100, url } : value));
    } catch (error) {
      setItems(current => current.map(value => value.id === item.id ? { ...value, status: cancelled.current ? 'cancelled' : 'error', error: explainError(error) } : value));
    }
  };

  const runAll = async () => {
    setRunning(true);
    cancelled.current = false;
    const queue = items.filter(item => item.status === 'ready' || item.status === 'error' || item.status === 'cancelled');
    for (const item of queue) {
      if (cancelled.current) break;
      await convertOne(item);
    }
    setRunning(false);
  };

  const cancel = () => {
    cancelled.current = true;
    cancelActiveMediaConversion();
    setRunning(false);
    setItems(current => current.map(item => item.status === 'processing' || item.status === 'ready' ? { ...item, status: 'cancelled' } : item));
  };

  const zip = async () => {
    const done = items.filter(item => item.status === 'completed' && item.url);
    const entries = await Promise.all(done.map(async item => ({ name: outputName(item), blob: await fetch(item.url!).then(response => response.blob()) })));
    const blob = await createZip(entries);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'conversions.zip';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async (item: Item) => {
    if (!item.url) return;
    const blob = await fetch(item.url).then(response => response.blob());
    const file = new File([blob], outputName(item), { type: blob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: outputName(item) });
  };

  const removeItem = (item: Item) => {
    forgetUrl(item.url);
    setItems(current => current.filter(value => value.id !== item.id));
  };

  const clearItems = () => {
    items.forEach(item => forgetUrl(item.url));
    setItems([]);
    setSelectionWarning('');
  };

  return (
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center"><h1 className="text-4xl font-bold tracking-tight text-gray-950">Conversions par lot</h1><p className="mt-3 text-gray-500">Mélangez les formats, choisissez chaque sortie et pilotez la file d’attente.</p></div>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <FileDropZone onFiles={addFiles} multiple title="Ajouter des fichiers compatibles" hint="ou glissez-déposez vos images, vidéos, fichiers audio ou documents ici" />
          {selectionWarning && <p role="alert" className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">{selectionWarning}</p>}

          {items.length > 0 && (
            <>
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">Estimation : environ {estimate.seconds} s · jusqu’à {estimate.memoryMb} MB de mémoire{estimate.warning && <strong className="mt-1 block text-amber-700">{estimate.warning}</strong>}</div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {(['converted', 'original', 'custom'] as const).map(value => <button key={value} type="button" onClick={() => setNaming(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${naming === value ? 'bg-gray-900 text-white' : 'bg-white'}`}>{value === 'converted' ? 'nom-original-converti' : value === 'original' ? 'Nom original' : 'Nom personnalisé'}</button>)}
                </div>
                <button type="button" onClick={clearItems} className="text-sm font-medium text-red-600">Vider la liste</button>
              </div>

              <div className="mt-4 space-y-3">
                {items.map(item => {
                  const ext = item.file.name.split('.').pop()?.toLowerCase() ?? '';
                  const formats = getAvailableOutputFormats(ext);
                  const type = getFileTypeFromExtension(ext);
                  return (
                    <article key={item.id} className="rounded-2xl border border-gray-200 p-3">
                      <div className="grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-center">
                        <FilePreview file={item.file} className="h-24" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.file.name}</p>
                          <p className="text-xs text-gray-500">{type} · {(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <select value={item.output} onChange={event => setItems(current => current.map(value => value.id === item.id ? { ...value, output: event.target.value, status: 'ready' } : value))} className="rounded-lg border px-2 py-1.5 text-xs">
                              {formats.map(format => <option key={format.extension} value={format.extension}>{format.name}</option>)}
                            </select>
                            {naming === 'custom' && <input value={item.customName} onChange={event => setItems(current => current.map(value => value.id === item.id ? { ...value, customName: event.target.value } : value))} className="rounded-lg border px-2 py-1.5 text-xs" />}
                          </div>
                          {item.status === 'processing' && <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-200"><div className="h-full bg-gray-900" style={{ width: `${item.progress}%` }} /></div>}
                          {item.error && <p className="mt-1 text-xs text-red-600">{item.error}</p>}
                        </div>
                        <div className="flex gap-1">
                          {item.status === 'completed' && item.url && <><a href={item.url} download={outputName(item)} aria-label={`Télécharger ${outputName(item)}`} className="rounded-lg bg-gray-900 p-2 text-white"><Download size={16} /></a>{'share' in navigator && <button type="button" onClick={() => void share(item)} aria-label="Partager" className="rounded-lg border p-2"><Share2 size={16} /></button>}</>}
                          {(item.status === 'error' || item.status === 'cancelled') && <button type="button" onClick={() => void convertOne(item)} aria-label="Réessayer" className="rounded-lg border p-2"><RefreshCw size={16} /></button>}
                          <button type="button" onClick={() => removeItem(item)} aria-label="Retirer" className="rounded-lg border p-2 text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {item.status === 'completed' && item.url && (
                        <details className="mt-3 border-t border-gray-100 pt-3">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-950"><Eye size={14} /> Voir l’aperçu du résultat</summary>
                          <div className="mt-3 max-w-2xl"><ResultPreview url={item.url} name={outputName(item)} /></div>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {running ? <button type="button" onClick={cancel} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 p-3 font-medium text-white"><Square size={16} /> Annuler</button> : <button type="button" onClick={() => void runAll()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 p-3 font-medium text-white"><Play size={16} /> Convertir la file</button>}
                {items.some(item => item.status === 'completed') && <button type="button" onClick={() => void zip()} className="rounded-xl border px-5 py-3 font-medium">Télécharger en ZIP</button>}
              </div>
              {running && <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={15} className="animate-spin" /> Traitement séquentiel pour protéger la mémoire de l’appareil.</p>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
