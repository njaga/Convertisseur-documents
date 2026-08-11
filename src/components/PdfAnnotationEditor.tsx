import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Maximize2, MousePointer2, RotateCcw, Trash2 } from 'lucide-react';
import { createPdfPagePreviews, PdfPagePreview } from '../services/pdfTools';
import { PdfAnnotationState } from '../types/documentLab';

interface PdfAnnotationEditorProps {
  file: File;
  signature: File | null;
  annotation: PdfAnnotationState;
  onChange: (next: PdfAnnotationState) => void;
  onRemoveSignature: () => void;
}

type Interaction = 'move' | 'resize';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function PdfAnnotationEditor({ file, signature, annotation, onChange, onRemoveSignature }: PdfAnnotationEditorProps) {
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

  const signatureUrl = useMemo(() => signature ? URL.createObjectURL(signature) : '', [signature]);

  useEffect(() => {
    return () => { if (signatureUrl) URL.revokeObjectURL(signatureUrl); };
  }, [signatureUrl]);

  useEffect(() => {
    let cancelled = false;
    const ownedUrls: string[] = [];

    createPdfPagePreviews([file], 1.05)
      .then(next => {
        ownedUrls.push(...next.map(item => item.url));
        if (cancelled) {
          next.forEach(item => URL.revokeObjectURL(item.url));
          return;
        }
        setPreviews(next);
      })
      .catch(() => { if (!cancelled) setError('Impossible de générer l’aperçu du PDF.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      ownedUrls.forEach(URL.revokeObjectURL);
    };
  }, [file]);

  const activePreview = previews.find(item => item.pageNumber === annotation.page) ?? previews[0];

  const startInteraction = (event: React.PointerEvent, mode: Interaction) => {
    if (!signature || !pageRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const rect = pageRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = {
      x: annotation.signatureX,
      y: annotation.signatureY,
      width: annotation.signatureWidth,
    };

    const handleMove = (pointerEvent: PointerEvent) => {
      const dx = (pointerEvent.clientX - startX) / rect.width * 100;
      const dy = (pointerEvent.clientY - startY) / rect.height * 100;

      if (mode === 'move') {
        const x = clamp(origin.x + dx, 0, Math.max(0, 100 - origin.width));
        const y = clamp(origin.y + dy, 0, 94);
        onChange({ ...annotation, signatureX: Number(x.toFixed(2)), signatureY: Number(y.toFixed(2)) });
      } else {
        const width = clamp(origin.width + dx, 8, Math.max(8, 95 - origin.x));
        onChange({ ...annotation, signatureWidth: Number(width.toFixed(2)) });
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
  };

  const nudge = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!signature) return;
    const step = event.shiftKey ? 3 : 1;
    let x = annotation.signatureX;
    let y = annotation.signatureY;
    if (event.key === 'ArrowLeft') x -= step;
    else if (event.key === 'ArrowRight') x += step;
    else if (event.key === 'ArrowUp') y -= step;
    else if (event.key === 'ArrowDown') y += step;
    else return;
    event.preventDefault();
    onChange({
      ...annotation,
      signatureX: clamp(x, 0, Math.max(0, 100 - annotation.signatureWidth)),
      signatureY: clamp(y, 0, 94),
    });
  };

  const resetSignature = () => onChange({ ...annotation, signatureX: 58, signatureY: 68, signatureWidth: 28 });

  if (loading) {
    return <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500"><Loader2 size={17} className="animate-spin" /> Génération de l’aperçu…</div>;
  }

  if (error || !activePreview) {
    return <p className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error || 'Aperçu indisponible.'}</p>;
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5" aria-label="Placement visuel de la signature">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Aperçu & placement</h3>
          <p className="mt-1 text-xs text-gray-500">Sélectionnez une page, puis glissez la signature. Utilisez la poignée pour l’agrandir ou la réduire.</p>
        </div>
        {signature && (
          <div className="flex gap-2">
            <button type="button" onClick={resetSignature} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium"><RotateCcw size={14} /> Recentrer</button>
            <button type="button" onClick={onRemoveSignature} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600"><Trash2 size={14} /> Retirer</button>
          </div>
        )}
      </div>

      {previews.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {previews.map(preview => (
            <button
              key={preview.pageNumber}
              type="button"
              onClick={() => onChange({ ...annotation, page: preview.pageNumber })}
              className={`relative w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 ${annotation.page === preview.pageNumber ? 'border-blue-600' : 'border-transparent hover:border-gray-300'}`}
            >
              <img src={preview.url} alt={`Page ${preview.pageNumber}`} className="aspect-[3/4] w-full object-contain" />
              <span className="absolute bottom-1 right-1 rounded bg-gray-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">{preview.pageNumber}</span>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-200/70 p-3 md:p-5">
        <div ref={pageRef} className="relative mx-auto w-fit max-w-full overflow-hidden bg-white shadow-lg">
          <img src={activePreview.url} alt={`Aperçu de la page ${annotation.page}`} className="block max-h-[70vh] max-w-full select-none" draggable={false} />

          {annotation.blackout && (
            <div
              aria-label="Aperçu de la zone masquée"
              className="pointer-events-none absolute bg-black"
              style={{ left: `${annotation.x}%`, top: `${annotation.y}%`, width: `${annotation.width}%`, height: '3.5%' }}
            />
          )}

          {annotation.text && (
            <div
              className="pointer-events-none absolute overflow-hidden whitespace-nowrap text-[clamp(8px,1.2vw,14px)] text-gray-950"
              style={{ left: `${annotation.x}%`, top: `${annotation.y}%`, width: `${annotation.width}%` }}
            >
              {annotation.text}
            </div>
          )}

          {signature && signatureUrl && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Signature. Glissez pour déplacer, flèches du clavier pour ajuster."
              onPointerDown={event => startInteraction(event, 'move')}
              onKeyDown={nudge}
              className="group absolute cursor-move touch-none border-2 border-blue-600 bg-white/10 outline-none ring-blue-500/20 focus:ring-4"
              style={{ left: `${annotation.signatureX}%`, top: `${annotation.signatureY}%`, width: `${annotation.signatureWidth}%` }}
            >
              <img src={signatureUrl} alt="Signature à positionner" draggable={false} className="pointer-events-none block h-auto w-full select-none" />
              <span className="pointer-events-none absolute -left-2 -top-7 hidden items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white shadow group-hover:flex"><MousePointer2 size={11} /> Déplacer</span>
              <button
                type="button"
                aria-label="Redimensionner la signature"
                onPointerDown={event => startInteraction(event, 'resize')}
                className="absolute -bottom-3 -right-3 flex h-7 w-7 cursor-nwse-resize touch-none items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>Page {annotation.page} sur {previews.length}</span>
        {signature ? <span>Position : {Math.round(annotation.signatureX)}% / {Math.round(annotation.signatureY)}% · largeur {Math.round(annotation.signatureWidth)}%</span> : <span>Ajoutez une signature ou un cachet pour le placer visuellement.</span>}
      </div>
    </section>
  );
}
