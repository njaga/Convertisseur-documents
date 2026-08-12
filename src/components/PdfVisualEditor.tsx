import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Cloud, Copy, Download, FilePlus2, Keyboard, Loader2, PencilLine, Redo2, RotateCcw, RotateCw, Scissors, Trash2, Undo2 } from 'lucide-react';
import PdfPageContentEditor from './PdfPageContentEditor';
import SortableHandle from './SortableHandle';
import { createPdfPagePreviews, PdfOutput } from '../services/pdfTools';
import { buildRichCompositePdf, clonePdfOverlays, getImageDimensions, getPdfPageDimensions, PdfOverlay } from '../services/pdfContentEditor';
import { hydratePdfEditorDraft, serializePdfEditorDraft, type PdfEditorDraftState, type PdfEditorWorkspacePage } from '../services/pdfEditorWorkspace';
import { findWorkspaceDraft, saveWorkspaceDraft } from '../services/workspace';

type PageState = PdfEditorWorkspacePage;
type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

const clonePages = (pages: PageState[], regenerateOverlayIds = false) => pages.map(page => ({
  ...page,
  overlays: clonePdfOverlays(page.overlays, regenerateOverlayIds),
}));

export default function PdfVisualEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [processing, setProcessing] = useState<'save' | 'extract' | null>(null);
  const [outputs, setOutputs] = useState<PdfOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<PageState[][]>([]);
  const [redoStack, setRedoStack] = useState<PageState[][]>([]);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [restoredDraft, setRestoredDraft] = useState(false);
  const lastSelected = useRef<number | null>(null);
  const objectUrls = useRef<string[]>([]);
  const outputUrls = useRef<string[]>([]);
  const initialPages = useRef<PageState[]>([]);
  const draftId = useRef<string | undefined>(undefined);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const redoButtonRef = useRef<HTMLButtonElement>(null);
  const selectAllButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      createPdfPagePreviews([file], 0.65),
      getPdfPageDimensions(file),
      findWorkspaceDraft<PdfEditorDraftState>('pdf-editor', file).catch(() => null),
    ])
      .then(async ([previews, dimensions, draft]) => {
        if (cancelled) {
          previews.forEach(preview => URL.revokeObjectURL(preview.url));
          return;
        }
        objectUrls.current.push(...previews.map(preview => preview.url));
        const basePages = previews.map((preview, index): PageState => ({
          id: `base-${index}`,
          kind: 'pdf',
          file,
          sourceIndex: index,
          pageNumber: preview.pageNumber,
          rotation: 0,
          url: preview.url,
          label: `Page ${preview.pageNumber}`,
          pageWidth: dimensions[index]?.width ?? 595,
          pageHeight: dimensions[index]?.height ?? 842,
          overlays: [],
        }));
        initialPages.current = clonePages(basePages);

        if (draft?.state?.pages?.length) {
          try {
            const restored = await hydratePdfEditorDraft(draft.state);
            if (cancelled) {
              restored.objectUrls.forEach(URL.revokeObjectURL);
              return;
            }
            objectUrls.current.push(...restored.objectUrls);
            draftId.current = draft.id;
            setPages(restored.pages);
            setRestoredDraft(true);
            setDraftStatus('saved');
            return;
          } catch {
            // Un brouillon partiellement illisible ne doit jamais bloquer l'ouverture du PDF original.
          }
        }

        setPages(basePages);
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

  useEffect(() => {
    if (loading || !pages.length) return undefined;
    const timer = window.setTimeout(() => {
      setDraftStatus('saving');
      saveWorkspaceDraft('pdf-editor', file, serializePdfEditorDraft(pages), draftId.current)
        .then(draft => {
          draftId.current = draft.id;
          setDraftStatus('saved');
        })
        .catch(() => setDraftStatus('error'));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [file, loading, pages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingId) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier && key === 's') {
        event.preventDefault();
        saveButtonRef.current?.click();
      } else if (modifier && key === 'a') {
        event.preventDefault();
        selectAllButtonRef.current?.click();
      } else if (modifier && key === 'z' && event.shiftKey) {
        event.preventDefault();
        redoButtonRef.current?.click();
      } else if (modifier && key === 'z') {
        event.preventDefault();
        undoButtonRef.current?.click();
      } else if (modifier && key === 'y') {
        event.preventDefault();
        redoButtonRef.current?.click();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selected.size) {
          event.preventDefault();
          deleteButtonRef.current?.click();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, selected.size]);

  const commit = (next: PageState[]) => {
    setUndoStack(stack => [...stack.slice(-29), clonePages(pages)]);
    setRedoStack([]);
    setPages(next);
    setOutputs([]);
  };

  const undo = () => {
    const previous = undoStack[undoStack.length - 1];
    if (!previous) return;
    setRedoStack(stack => [...stack.slice(-29), clonePages(pages)]);
    setUndoStack(stack => stack.slice(0, -1));
    setPages(clonePages(previous));
    setSelected(new Set());
    setOutputs([]);
  };

  const redo = () => {
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    setUndoStack(stack => [...stack.slice(-29), clonePages(pages)]);
    setRedoStack(stack => stack.slice(0, -1));
    setPages(clonePages(next));
    setSelected(new Set());
    setOutputs([]);
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

  const reorderPages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= pages.length || toIndex >= pages.length) return;
    const next = [...pages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
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
      if (selected.has(page.id)) {
        next.push({
          ...page,
          id: `${page.id}-copy-${crypto.randomUUID()}`,
          label: `${page.label} (copie)`,
          overlays: clonePdfOverlays(page.overlays, true),
        });
      }
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
          const [previews, dimensions] = await Promise.all([createPdfPagePreviews([incoming], 0.65), getPdfPageDimensions(incoming)]);
          objectUrls.current.push(...previews.map(preview => preview.url));
          inserted.push(...previews.map((preview, index): PageState => ({
            id: `insert-${crypto.randomUUID()}`,
            kind: 'pdf',
            file: incoming,
            sourceIndex: index,
            pageNumber: preview.pageNumber,
            rotation: 0,
            url: preview.url,
            label: `${incoming.name} · page ${preview.pageNumber}`,
            pageWidth: dimensions[index]?.width ?? 595,
            pageHeight: dimensions[index]?.height ?? 842,
            overlays: [],
          })));
        } else if (incoming.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'ico'].includes(extension ?? '')) {
          const url = URL.createObjectURL(incoming);
          const dimensions = await getImageDimensions(incoming);
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
            pageWidth: dimensions.width,
            pageHeight: dimensions.height,
            overlays: [],
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
    if (!initialPages.current.length) return;
    setUndoStack(stack => [...stack.slice(-29), clonePages(pages)]);
    setRedoStack([]);
    setPages(clonePages(initialPages.current));
    setSelected(new Set());
    replaceOutputs([]);
  };

  const applyContent = (pageId: string, overlays: PdfOverlay[]) => {
    commit(pages.map(page => page.id === pageId ? { ...page, overlays: clonePdfOverlays(overlays) } : page));
    setEditingId(null);
  };

  const generate = async (mode: 'save' | 'extract') => {
    setError(null);
    setProcessing(mode);
    try {
      const target = mode === 'extract' ? pages.filter(page => selected.has(page.id)) : pages;
      if (mode === 'extract' && !target.length) throw new Error('Sélectionnez au moins une page à extraire.');
      const output = await buildRichCompositePdf(
        target.map(({ kind, file: sourceFile, sourceIndex, rotation, overlays }) => ({ kind, file: sourceFile, sourceIndex, rotation, overlays })),
        `${file.name.replace(/\.pdf$/i, '')}-${mode === 'extract' ? 'pages-extraites' : 'modifie'}.pdf`,
      );
      replaceOutputs([output]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de générer le PDF.');
    } finally {
      setProcessing(null);
    }
  };

  const editingPage = editingId ? pages.find(page => page.id === editingId) ?? null : null;

  if (loading) return <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Chargement de l’éditeur…</div>;

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6" aria-label="Éditeur PDF visuel">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Éditeur PDF visuel</h2>
          <p className="mt-1 text-xs text-gray-500">Réorganisez les pages par glisser-déposer, puis ouvrez-en une pour ajouter texte, signature, image, surlignage, caviardage ou dessin.</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              {draftStatus === 'saving' ? <Cloud size={13} className="animate-pulse text-blue-600" /> : <CheckCircle2 size={13} className={draftStatus === 'error' ? 'text-red-500' : 'text-emerald-600'} />}
              {draftStatus === 'saving' ? 'Sauvegarde locale…' : draftStatus === 'error' ? 'Brouillon non sauvegardé' : restoredDraft ? 'Brouillon restauré et sauvegardé localement' : 'Sauvegarde automatique locale'}
            </span>
            <a href="/brouillons" className="font-semibold text-blue-700 hover:underline">Voir les brouillons</a>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><Keyboard size={13} /> Ctrl/⌘+S · Ctrl/⌘+Z · Ctrl/⌘+A</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button ref={undoButtonRef} type="button" onClick={undo} disabled={!undoStack.length} title="Annuler · Ctrl/⌘+Z" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-35"><Undo2 size={14} /> Annuler</button>
          <button ref={redoButtonRef} type="button" onClick={redo} disabled={!redoStack.length} title="Rétablir · Ctrl/⌘+Shift+Z" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-35"><Redo2 size={14} /> Rétablir</button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium"><FilePlus2 size={14} /> {inserting ? 'Insertion…' : 'Insérer PDF/images'}<input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.ico,application/pdf,image/*" onChange={event => { void handleInsert(event.target.files); event.target.value = ''; }} /></label>
          <button ref={selectAllButtonRef} type="button" onClick={() => setSelected(new Set(pages.map(page => page.id)))} title="Tout sélectionner · Ctrl/⌘+A" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium">Tout sélectionner</button>
          <button type="button" onClick={reset} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium">Réinitialiser</button>
        </div>
      </div>

      <div className="grid max-h-[44rem] grid-cols-2 gap-3 overflow-auto rounded-xl border border-gray-200 bg-gray-200/60 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((page, index) => {
          const isSelected = selected.has(page.id);
          return (
            <article key={page.id} data-sortable-index={index} className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${isSelected ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-400'}`}>
              <button type="button" onClick={event => togglePage(index, event.shiftKey)} onDoubleClick={() => setEditingId(page.id)} className="block w-full text-left">
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  <img src={page.url} alt={page.label} style={{ transform: `rotate(${page.rotation}deg)` }} className="h-full w-full object-contain transition-transform duration-200" />
                  <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[11px] font-bold text-white">{index + 1}</span>
                  {page.overlays.length > 0 && <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">{page.overlays.length} ajout{page.overlays.length > 1 ? 's' : ''}</span>}
                  {page.rotation !== 0 && <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold shadow">{page.rotation}°</span>}
                </div>
              </button>
              <div className="border-t border-gray-100 px-2 py-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <SortableHandle index={index} itemCount={pages.length} onMove={reorderPages} label={`Déplacer ${page.label}`} className="flex h-7 w-7 shrink-0 items-center justify-center border-0 bg-gray-50 shadow-none" />
                    <span className="min-w-0 truncate text-[11px] text-gray-500">{page.label}</span>
                  </div>
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => setEditingId(page.id)} aria-label="Modifier le contenu" title="Modifier le contenu" className="rounded p-1.5 text-blue-600 hover:bg-blue-50"><PencilLine size={14} /></button>
                    <button type="button" onClick={() => rotate(page.id, -90)} aria-label="Tourner à gauche" className="rounded p-1.5 hover:bg-gray-100"><RotateCcw size={14} /></button>
                    <button type="button" onClick={() => rotate(page.id, 90)} aria-label="Tourner à droite" className="rounded p-1.5 hover:bg-gray-100"><RotateCw size={14} /></button>
                  </div>
                </div>
                <button type="button" onClick={() => setEditingId(page.id)} className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"><PencilLine size={12} /> Modifier le contenu</button>
              </div>
            </article>
          );
        })}
      </div>

      {pages.length === 0 && <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">Le document ne contient plus aucune page. Utilisez Annuler, Réinitialiser ou insérez un nouveau PDF/image.</p>}

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-gray-600"><strong>{selected.size}</strong> sélectionnée{selected.size > 1 ? 's' : ''} · <strong>{pages.length}</strong> dans le document · <strong>{pages.reduce((total, page) => total + page.overlays.length, 0)}</strong> élément{pages.reduce((total, page) => total + page.overlays.length, 0) > 1 ? 's' : ''} ajouté{pages.reduce((total, page) => total + page.overlays.length, 0) > 1 ? 's' : ''}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={duplicateSelected} disabled={!selected.size} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"><Copy size={16} /> Dupliquer</button>
          <button ref={deleteButtonRef} type="button" onClick={deleteSelected} disabled={!selected.size} title="Supprimer · Suppr" className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-40"><Trash2 size={16} /> Supprimer</button>
          <button type="button" onClick={() => void generate('extract')} disabled={!selected.size || processing !== null} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"><Scissors size={16} /> Extraire</button>
          <button ref={saveButtonRef} type="button" onClick={() => void generate('save')} disabled={!pages.length || processing !== null} title="Générer · Ctrl/⌘+S" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-gray-300"><Download size={16} /> {processing === 'save' ? 'Génération…' : 'Générer le PDF'}</button>
        </div>
      </div>

      <div className="sticky bottom-3 z-30 mt-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">
        <button type="button" onClick={undo} disabled={!undoStack.length} aria-label="Annuler" className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-30"><Undo2 size={17} /></button>
        <button type="button" onClick={redo} disabled={!redoStack.length} aria-label="Rétablir" className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-30"><Redo2 size={17} /></button>
        <button type="button" onClick={() => void generate('save')} disabled={!pages.length || processing !== null} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white disabled:bg-gray-300"><Download size={16} /> {processing === 'save' ? 'Génération…' : 'Générer'}</button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {outputs.map(output => (
        <div key={output.url} className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
          <div className="flex items-center justify-between gap-3 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <span className="truncate">{output.name}</span>
            <a href={output.url} download={output.name} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-white"><Download size={15} /> Télécharger</a>
          </div>
          <iframe src={`${output.url}#toolbar=0&navpanes=0`} title={`Aperçu de ${output.name}`} className="h-[32rem] w-full bg-gray-100" />
        </div>
      ))}

      {editingPage && (
        <PdfPageContentEditor
          key={editingPage.id}
          label={editingPage.label}
          previewUrl={editingPage.url}
          pageWidth={editingPage.pageWidth}
          pageHeight={editingPage.pageHeight}
          rotation={editingPage.rotation}
          overlays={editingPage.overlays}
          onApply={overlays => applyContent(editingPage.id, overlays)}
          onClose={() => setEditingId(null)}
        />
      )}
    </section>
  );
}
