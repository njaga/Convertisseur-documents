import { useEffect, useRef, useState } from 'react';
import { Download, GripVertical, Loader2, RotateCcw, RotateCw, Scissors, Trash2, Undo2 } from 'lucide-react';
import { buildEditedPdf, createPdfPagePreviews, PdfOutput } from '../services/pdfTools';

interface PageState {
  sourceIndex: number;
  pageNumber: number;
  rotation: 0 | 90 | 180 | 270;
  url: string;
}

export default function PdfVisualEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<'save' | 'extract' | null>(null);
  const [outputs, setOutputs] = useState<PdfOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const draggedIndex = useRef<number | null>(null);
  const lastSelected = useRef<number | null>(null);
  const previewUrls = useRef<string[]>([]);
  const outputUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    createPdfPagePreviews([file], 0.65)
      .then(previews => {
        if (cancelled) {
          previews.forEach(preview => URL.revokeObjectURL(preview.url));
          return;
        }
        previewUrls.current.push(...previews.map(preview => preview.url));
        setPages(previews.map((preview, index) => ({
          sourceIndex: index,
          pageNumber: preview.pageNumber,
          rotation: 0,
          url: preview.url,
        })));
      })
      .catch(() => setError('Impossible de charger ce PDF dans l’éditeur.'))
      .finally(() => { if (!cancelled) setLoading(false); });

    const previews = previewUrls.current;
    const results = outputUrls.current;
    return () => {
      cancelled = true;
      previews.forEach(URL.revokeObjectURL);
      results.forEach(URL.revokeObjectURL);
    };
  }, [file]);

  const replaceOutputs = (next: PdfOutput[]) => {
    outputUrls.current.forEach(URL.revokeObjectURL);
    outputUrls.current.splice(0, outputUrls.current.length, ...next.map(output => output.url));
    setOutputs(next);
  };

  const togglePage = (index: number, shiftKey: boolean) => {
    setSelected(current => {
      const next = new Set(current);
      if (shiftKey && lastSelected.current !== null) {
        const start = Math.min(lastSelected.current, index);
        const end = Math.max(lastSelected.current, index);
        for (let item = start; item <= end; item += 1) next.add(pages[item].sourceIndex);
      } else {
        const id = pages[index].sourceIndex;
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      lastSelected.current = index;
      return next;
    });
  };

  const rotate = (sourceIndex: number, direction: -90 | 90) => {
    setPages(current => current.map(page => page.sourceIndex === sourceIndex
      ? { ...page, rotation: ((page.rotation + direction + 360) % 360) as PageState['rotation'] }
      : page));
  };

  const dropAt = (targetIndex: number) => {
    const sourceIndex = draggedIndex.current;
    draggedIndex.current = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    setPages(current => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const deleteSelected = () => {
    if (!selected.size) return;
    setPages(current => current.filter(page => !selected.has(page.sourceIndex)));
    setSelected(new Set());
  };

  const reset = () => {
    setPages(current => [...current]
      .sort((a, b) => a.sourceIndex - b.sourceIndex)
      .map(page => ({ ...page, rotation: 0 })));
    setSelected(new Set());
    setError(null);
    replaceOutputs([]);
  };

  const generate = async (mode: 'save' | 'extract') => {
    setError(null);
    setProcessing(mode);
    try {
      const target = mode === 'extract' ? pages.filter(page => selected.has(page.sourceIndex)) : pages;
      if (mode === 'extract' && !target.length) throw new Error('Sélectionnez au moins une page à extraire.');
      const output = await buildEditedPdf(
        file,
        target.map(page => ({ sourceIndex: page.sourceIndex, rotation: page.rotation })),
        mode === 'extract' ? 'pages-extraites' : 'modifie'
      );
      replaceOutputs([output]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de générer le PDF.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Chargement de l’éditeur…</div>;

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6" aria-label="Éditeur PDF visuel">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Éditeur visuel</h2>
          <p className="mt-1 text-xs text-gray-500">Glissez les pages pour les déplacer. Cliquez pour sélectionner, Maj + clic pour sélectionner une plage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelected(new Set(pages.map(page => page.sourceIndex)))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">Tout sélectionner</button>
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">Désélectionner</button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"><Undo2 size={14} /> Réinitialiser</button>
        </div>
      </div>

      <div className="grid max-h-[42rem] grid-cols-2 gap-3 overflow-auto rounded-xl border border-gray-200 bg-gray-200/60 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((page, index) => {
          const isSelected = selected.has(page.sourceIndex);
          return (
            <article
              key={page.sourceIndex}
              draggable
              onDragStart={() => { draggedIndex.current = index; }}
              onDragOver={event => event.preventDefault()}
              onDrop={() => dropAt(index)}
              className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${isSelected ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-400'}`}
            >
              <button type="button" onClick={event => togglePage(index, event.shiftKey)} className="block w-full text-left">
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  <img src={page.url} alt={`Page ${page.pageNumber}`} style={{ transform: `rotate(${page.rotation}deg)` }} className="h-full w-full object-contain transition-transform duration-200" />
                  <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[11px] font-bold text-white">{index + 1}</span>
                  {page.rotation !== 0 && <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow">{page.rotation}°</span>}
                </div>
              </button>
              <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5">
                <span className="inline-flex cursor-grab items-center gap-1 text-[11px] text-gray-500"><GripVertical size={13} /> Page {page.pageNumber}</span>
                <div className="flex">
                  <button type="button" onClick={() => rotate(page.sourceIndex, -90)} aria-label="Tourner à gauche" className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><RotateCcw size={14} /></button>
                  <button type="button" onClick={() => rotate(page.sourceIndex, 90)} aria-label="Tourner à droite" className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><RotateCw size={14} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!pages.length && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Toutes les pages ont été supprimées. Réinitialisez le document pour continuer.</p>}

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600"><strong>{selected.size}</strong> page{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''} · <strong>{pages.length}</strong> page{pages.length > 1 ? 's' : ''} dans le document final</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={deleteSelected} disabled={!selected.size} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-40"><Trash2 size={16} /> Supprimer</button>
          <button type="button" onClick={() => generate('extract')} disabled={!selected.size || processing !== null} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 disabled:opacity-40"><Scissors size={16} /> {processing === 'extract' ? 'Extraction…' : 'Extraire la sélection'}</button>
          <button type="button" onClick={() => generate('save')} disabled={!pages.length || processing !== null} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-gray-300"><Download size={16} /> {processing === 'save' ? 'Génération…' : 'Télécharger le PDF'}</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {outputs.map(output => <a key={output.url} href={output.url} download={output.name} className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>{output.name}</span><span className="inline-flex items-center gap-1.5"><Download size={15} /> Télécharger</span></a>)}
    </section>
  );
}
