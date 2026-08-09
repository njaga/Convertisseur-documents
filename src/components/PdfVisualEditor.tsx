import { useEffect, useRef, useState } from 'react';
import { Copy, Download, FilePlus2, GripVertical, Loader2, Maximize2, Redo2, RotateCcw, RotateCw, Scissors, Trash2, Undo2, X } from 'lucide-react';
import { buildCompositePdf, CompositePdfPage, createPdfPagePreviews, PdfOutput } from '../services/pdfTools';

interface PageState extends CompositePdfPage {
  id: string;
  pageNumber: number;
  url: string;
  label: string;
}

const clonePages = (pages: PageState[]) => pages.map(page => ({ ...page }));

export default function PdfVisualEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [processing, setProcessing] = useState<'save' | 'extract' | null>(null);
  const [outputs, setOutputs] = useState<PdfOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<PageState | null>(null);
  const [undoStack, setUndoStack] = useState<PageState[][]>([]);
  const [redoStack, setRedoStack] = useState<PageState[][]>([]);
  const draggedIndex = useRef<number | null>(null);
  const lastSelected = useRef<number | null>(null);
  const objectUrls = useRef<string[]>([]);
  const outputUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    createPdfPagePreviews([file], 0.65)
      .then(previews => {
        if (cancelled) {
          previews.forEach(preview => URL.revokeObjectURL(preview.url));
          return;
        }
        objectUrls.current.push(...previews.map(preview => preview.url));
        setPages(previews.map((preview, index) => ({
          id: `base-${index}`,
          kind: 'pdf',
          file,
          sourceIndex: index,
          pageNumber: preview.pageNumber,
          rotation: 0,
          url: preview.url,
          label: `Page ${preview.pageNumber}`,
        })));
      })
      .catch(() => setError('Impossible de charger ce PDF dans l’éditeur.'))
      .finally(() => { if (!cancelled) setLoading(false); });

    const previews = objectUrls.current;
    const results = outputUrls.current;
    return () => {
      cancelled = true;
      previews.forEach(URL.revokeObjectURL);
      results.forEach(URL.revokeObjectURL);
    };
  }, [file]);

  const commit = (next: PageState[]) => {
    setUndoStack(stack => [...stack.slice(-29), clonePages(pages)]);
    setRedoStack([]);
    setPages(next);
  };

  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack(stack => [...stack, clonePages(pages)]);
    setUndoStack(stack => stack.slice(0, -1));
    setPages(clonePages(previous));
    setSelected(new Set());
  };

  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack(stack => [...stack, clonePages(pages)]);
    setRedoStack(stack => stack.slice(0, -1));
    setPages(clonePages(next));
    setSelected(new Set());
  };

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
        for (let item = start; item <= end; item += 1) next.add(pages[item].id);
      } else {
        const id = pages[index].id;
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      lastSelected.current = index;
      return next;
    });
  };

  const rotate = (id: string, direction: -90 | 90) => commit(pages.map(page => page.id === id
    ? { ...page, rotation: ((page.rotation + direction + 360) % 360) as PageState['rotation'] }
    : page));

  const dropAt = (targetIndex: number) => {
    const sourceIndex = draggedIndex.current;
    draggedIndex.current = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const next = [...pages];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    commit(next);
  };

  const deleteSelected = () => {
    if (!selected.size) return;
    commit(pages.filter(page => !selected.has(page.id)));
    setSelected(new Set());
  };

  const duplicateSelected = () => {
    if (!selected.size) return;
    const next: PageState[] = [];
    pages.forEach(page => {
      next.push(page);
      if (selected.has(page.id)) next.push({ ...page, id: `${page.id}-copy-${crypto.randomUUID()}`, label: `${page.label} (copie)` });
    });
    commit(next);
    setSelected(new Set());
  };

  const handleInsert = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setInserting(true);
    setError(null);
    try {
      const inserted: PageState[] = [];
      for (const incoming of Array.from(fileList)) {
        const extension = incoming.name.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
          const previews = await createPdfPagePreviews([incoming], 0.65);
          objectUrls.current.push(...previews.map(preview => preview.url));
          inserted.push(...previews.map((preview, index) => ({
            id: `insert-${crypto.randomUUID()}`,
            kind: 'pdf' as const,
            file: incoming,
            sourceIndex: index,
            pageNumber: preview.pageNumber,
            rotation: 0 as const,
            url: preview.url,
            label: `${incoming.name} · page ${preview.pageNumber}`,
          })));
        } else if (incoming.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'ico'].includes(extension ?? '')) {
          const url = URL.createObjectURL(incoming);
          objectUrls.current.push(url);
          inserted.push({
            id: `image-${crypto.randomUUID()}`,
            kind: 'image',
            file: incoming,
            sourceIndex: 0,
            pageNumber: 1,
            rotation: 0,
            url,
            label: incoming.name,
          });
        } else throw new Error(`${incoming.name} n’est ni un PDF ni une image compatible.`);
      }

      const selectedIndices = pages.map((page, index) => selected.has(page.id) ? index : -1).filter(index => index >= 0);
      const insertAt = selectedIndices.length ? Math.max(...selectedIndices) + 1 : pages.length;
      const next = [...pages];
      next.splice(insertAt, 0, ...inserted);
      commit(next);
      setSelected(new Set(inserted.map(page => page.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible d’insérer ces fichiers.');
    } finally {
      setInserting(false);
    }
  };

  const reset = () => {
    setUndoStack(stack => [...stack, clonePages(pages)]);
    setRedoStack([]);
    setPages(pages.filter(page => page.file === file && page.kind === 'pdf' && page.id.startsWith('base-'))
      .sort((a, b) => a.sourceIndex - b.sourceIndex)
      .map(page => ({ ...page, rotation: 0 })));
    setSelected(new Set());
    replaceOutputs([]);
  };

  const generate = async (mode: 'save' | 'extract') => {
    setError(null);
    setProcessing(mode);
    try {
      const target = mode === 'extract' ? pages.filter(page => selected.has(page.id)) : pages;
      if (mode === 'extract' && !target.length) throw new Error('Sélectionnez au moins une page à extraire.');
      const output = await buildCompositePdf(
        target.map(({ kind, file: sourceFile, sourceIndex, rotation }) => ({ kind, file: sourceFile, sourceIndex, rotation })),
        `${file.name.replace(/\.pdf$/i, '')}-${mode === 'extract' ? 'pages-extraites' : 'modifie'}.pdf`
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
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="font-semibold text-gray-900">Éditeur visuel</h2><p className="mt-1 text-xs text-gray-500">Glissez pour déplacer. Cliquez pour sélectionner. Maj + clic sélectionne une plage.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={undo} disabled={!undoStack.length} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-35"><Undo2 size={14} /> Annuler</button>
          <button type="button" onClick={redo} disabled={!redoStack.length} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-35"><Redo2 size={14} /> Rétablir</button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium"><FilePlus2 size={14} /> {inserting ? 'Insertion…' : 'Insérer PDF/images'}<input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.ico,application/pdf,image/*" onChange={event => { void handleInsert(event.target.files); event.target.value = ''; }} /></label>
          <button type="button" onClick={() => setSelected(new Set(pages.map(page => page.id)))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium">Tout sélectionner</button>
          <button type="button" onClick={reset} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium">Réinitialiser</button>
        </div>
      </div>

      <div className="grid max-h-[44rem] grid-cols-2 gap-3 overflow-auto rounded-xl border border-gray-200 bg-gray-200/60 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((page, index) => {
          const isSelected = selected.has(page.id);
          return <article key={page.id} draggable onDragStart={() => { draggedIndex.current = index; }} onDragOver={event => event.preventDefault()} onDrop={() => dropAt(index)} className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${isSelected ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-400'}`}>
            <button type="button" onClick={event => togglePage(index, event.shiftKey)} className="block w-full text-left">
              <div className="relative aspect-[3/4] overflow-hidden bg-white">
                <img src={page.url} alt={page.label} style={{ transform: `rotate(${page.rotation}deg)` }} className="h-full w-full object-contain transition-transform duration-200" />
                <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[11px] font-bold text-white">{index + 1}</span>
                {page.rotation !== 0 && <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold shadow">{page.rotation}°</span>}
              </div>
            </button>
            <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5">
              <span className="inline-flex min-w-0 cursor-grab items-center gap-1 truncate text-[11px] text-gray-500"><GripVertical size={13} /> {page.label}</span>
              <div className="flex shrink-0">
                <button type="button" onClick={() => setZoomed(page)} aria-label="Agrandir" className="rounded p-1.5 hover:bg-gray-100"><Maximize2 size={14} /></button>
                <button type="button" onClick={() => rotate(page.id, -90)} aria-label="Tourner à gauche" className="rounded p-1.5 hover:bg-gray-100"><RotateCcw size={14} /></button>
                <button type="button" onClick={() => rotate(page.id, 90)} aria-label="Tourner à droite" className="rounded p-1.5 hover:bg-gray-100"><RotateCw size={14} /></button>
              </div>
            </div>
          </article>;
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-gray-600"><strong>{selected.size}</strong> sélectionnée{selected.size > 1 ? 's' : ''} · <strong>{pages.length}</strong> dans le document</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={duplicateSelected} disabled={!selected.size} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"><Copy size={16} /> Dupliquer</button>
          <button type="button" onClick={deleteSelected} disabled={!selected.size} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-40"><Trash2 size={16} /> Supprimer</button>
          <button type="button" onClick={() => void generate('extract')} disabled={!selected.size || processing !== null} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"><Scissors size={16} /> Extraire</button>
          <button type="button" onClick={() => void generate('save')} disabled={!pages.length || processing !== null} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-gray-300"><Download size={16} /> {processing === 'save' ? 'Génération…' : 'Télécharger le PDF'}</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {outputs.map(output => <a key={output.url} href={output.url} download={output.name} className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>{output.name}</span><span className="inline-flex items-center gap-1.5"><Download size={15} /> Télécharger</span></a>)}

      {zoomed && <div role="dialog" aria-modal="true" aria-label={zoomed.label} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomed(null)}>
        <button type="button" onClick={() => setZoomed(null)} className="absolute right-5 top-5 rounded-full bg-white p-2 text-gray-900"><X size={20} /></button>
        <img src={zoomed.url} alt={zoomed.label} style={{ transform: `rotate(${zoomed.rotation}deg)` }} className="max-h-[88vh] max-w-[92vw] object-contain" onClick={event => event.stopPropagation()} />
      </div>}
    </section>
  );
}
