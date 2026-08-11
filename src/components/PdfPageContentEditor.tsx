import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, CalendarDays, Check, Copy, Eraser, Highlighter, ImagePlus, MousePointer2, PenLine, Square, Trash2, Type, X } from 'lucide-react';
import { clonePdfOverlays, getImageDimensions, PdfDrawOverlay, PdfImageOverlay, PdfOverlay, PositionedPdfOverlay } from '../services/pdfContentEditor';

type Props = {
  label: string;
  previewUrl: string;
  pageWidth: number;
  pageHeight: number;
  rotation: 0 | 90 | 180 | 270;
  overlays: PdfOverlay[];
  onApply: (overlays: PdfOverlay[]) => void;
  onClose: () => void;
};

type Interaction = {
  id: string;
  type: 'move' | 'resize';
  startClientX: number;
  startClientY: number;
  start: PositionedPdfOverlay;
  canvasWidth: number;
  canvasHeight: number;
};

type EditorMode = 'select' | 'draw';

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const isPositioned = (overlay: PdfOverlay): overlay is PositionedPdfOverlay => overlay.kind !== 'draw';

function OverlayImage({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt="Élément ajouté" className="h-full w-full select-none object-fill" draggable={false} />;
}

function cloneDraft(overlays: PdfOverlay[]) {
  return clonePdfOverlays(overlays);
}

export default function PdfPageContentEditor({ label, previewUrl, pageWidth, pageHeight, rotation, overlays, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<PdfOverlay[]>(() => cloneDraft(overlays));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('select');
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [canvasPixelWidth, setCanvasPixelWidth] = useState(600);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = draft.find(overlay => overlay.id === selectedId) ?? null;
  const previewScale = canvasPixelWidth / Math.max(pageWidth, 1);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const update = () => setCanvasPixelWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!interaction) return;
    const handleMove = (event: PointerEvent) => {
      const dx = (event.clientX - interaction.startClientX) / interaction.canvasWidth * 100;
      const dy = (event.clientY - interaction.startClientY) / interaction.canvasHeight * 100;
      setDraft(current => current.map(overlay => {
        if (overlay.id !== interaction.id || !isPositioned(overlay)) return overlay;
        if (interaction.type === 'move') {
          return {
            ...overlay,
            x: clamp(interaction.start.x + dx, 0, 100 - interaction.start.width),
            y: clamp(interaction.start.y + dy, 0, 100 - interaction.start.height),
          };
        }
        return {
          ...overlay,
          width: clamp(interaction.start.width + dx, 3, 100 - interaction.start.x),
          height: clamp(interaction.start.height + dy, 2, 100 - interaction.start.y),
        };
      }));
    };
    const handleUp = () => setInteraction(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [interaction]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setMode('select');
        setSelectedId(null);
        return;
      }
      if (!selectedId) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        setDraft(current => current.filter(overlay => overlay.id !== selectedId));
        setSelectedId(null);
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 1 : 0.25;
      setDraft(current => current.map(overlay => {
        if (overlay.id !== selectedId || !isPositioned(overlay)) return overlay;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        return { ...overlay, x: clamp(overlay.x + dx, 0, 100 - overlay.width), y: clamp(overlay.y + dy, 0, 100 - overlay.height) };
      }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const updateOverlay = (id: string, updater: (overlay: PdfOverlay) => PdfOverlay) => {
    setDraft(current => current.map(overlay => overlay.id === id ? updater(overlay) : overlay));
  };

  const addText = (value = 'Votre texte') => {
    const overlay: PdfOverlay = {
      id: crypto.randomUUID(), kind: 'text', x: 12, y: 12, width: 40, height: 8,
      text: value, fontSize: 18, color: '#111827', bold: false, align: 'left', opacity: 1,
    };
    setDraft(current => [...current, overlay]);
    setSelectedId(overlay.id);
    setMode('select');
  };

  const addRect = (preset: 'highlight' | 'outline' | 'whiteout' | 'redact') => {
    const settings = preset === 'highlight'
      ? { color: '#fde047', fill: true, opacity: 0.4, borderWidth: 1, height: 5 }
      : preset === 'outline'
        ? { color: '#2563eb', fill: false, opacity: 1, borderWidth: 2, height: 12 }
        : preset === 'whiteout'
          ? { color: '#ffffff', fill: true, opacity: 1, borderWidth: 0, height: 8 }
          : { color: '#000000', fill: true, opacity: 1, borderWidth: 0, height: 8 };
    const overlay: PdfOverlay = {
      id: crypto.randomUUID(), kind: 'rect', x: 12, y: 30, width: 38, height: settings.height,
      color: settings.color, fill: settings.fill, borderWidth: settings.borderWidth, opacity: settings.opacity,
    };
    setDraft(current => [...current, overlay]);
    setSelectedId(overlay.id);
    setMode('select');
  };

  const addImage = async (file: File | undefined) => {
    if (!file) return;
    const dimensions = await getImageDimensions(file).catch(() => ({ width: 1, height: 1 }));
    const width = 28;
    const proportionalHeight = width * (pageWidth / Math.max(pageHeight, 1)) * (dimensions.height / Math.max(dimensions.width, 1));
    const overlay: PdfImageOverlay = {
      id: crypto.randomUUID(), kind: 'image', x: 12, y: 18, width, height: clamp(proportionalHeight, 4, 35), file, opacity: 1,
    };
    setDraft(current => [...current, overlay]);
    setSelectedId(overlay.id);
    setMode('select');
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setDraft(current => current.filter(overlay => overlay.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = clonePdfOverlays([selected], true)[0];
    const shifted = isPositioned(copy)
      ? { ...copy, x: clamp(copy.x + 2, 0, 100 - copy.width), y: clamp(copy.y + 2, 0, 100 - copy.height) }
      : copy;
    setDraft(current => [...current, shifted]);
    setSelectedId(shifted.id);
  };

  const reorderSelected = (direction: 'front' | 'back') => {
    if (!selectedId) return;
    setDraft(current => {
      const index = current.findIndex(overlay => overlay.id === selectedId);
      if (index < 0) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (direction === 'front') next.push(item);
      else next.unshift(item);
      return next;
    });
  };

  const beginInteraction = (event: ReactPointerEvent, overlay: PositionedPdfOverlay, type: 'move' | 'resize') => {
    if (mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    const canvas = canvasRef.current?.getBoundingClientRect();
    if (!canvas) return;
    setSelectedId(overlay.id);
    setInteraction({
      id: overlay.id,
      type,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: { ...overlay },
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    });
  };

  const pointFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width * 100, 0, 100),
      y: clamp((event.clientY - rect.top) / rect.height * 100, 0, 100),
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'draw') {
      setSelectedId(null);
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const overlay: PdfDrawOverlay = {
      id: crypto.randomUUID(), kind: 'draw', points: [pointFromPointer(event)], color: '#111827', thickness: 2, opacity: 1,
    };
    setDraft(current => [...current, overlay]);
    setDrawingId(overlay.id);
    setSelectedId(overlay.id);
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'draw' || !drawingId || event.buttons === 0) return;
    const point = pointFromPointer(event);
    updateOverlay(drawingId, overlay => overlay.kind === 'draw' ? { ...overlay, points: [...overlay.points, point] } : overlay);
  };

  const stopDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drawingId && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDrawingId(null);
  };

  const overlayStyle = (overlay: PositionedPdfOverlay) => ({
    left: `${overlay.x}%`, top: `${overlay.y}%`, width: `${overlay.width}%`, height: `${overlay.height}%`, opacity: overlay.opacity,
    pointerEvents: mode === 'draw' ? 'none' as const : 'auto' as const,
  });

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-gray-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Modifier le contenu de ${label}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div>
          <h2 className="font-semibold text-gray-950">Modifier le contenu · {label}</h2>
          <p className="mt-0.5 text-xs text-gray-500">Ajoutez du texte, une signature, des formes ou dessinez directement sur la page.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"><X size={15} /> Annuler</button>
          <button type="button" onClick={() => onApply(cloneDraft(draft))} className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white"><Check size={15} /> Appliquer</button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-900">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-gray-950/80 px-3 py-2 text-white md:px-5">
            <button type="button" onClick={() => setMode('select')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${mode === 'select' ? 'bg-white text-gray-950' : 'bg-white/10 hover:bg-white/15'}`}><MousePointer2 size={14} /> Sélectionner</button>
            <button type="button" onClick={() => addText()} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><Type size={14} /> Texte</button>
            <button type="button" onClick={() => addText(new Date().toLocaleDateString('fr-FR'))} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><CalendarDays size={14} /> Date</button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><ImagePlus size={14} /> Image / signature<input type="file" accept="image/*" className="hidden" onChange={event => { void addImage(event.target.files?.[0]); event.target.value = ''; }} /></label>
            <button type="button" onClick={() => addRect('highlight')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><Highlighter size={14} /> Surligner</button>
            <button type="button" onClick={() => addRect('outline')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><Square size={14} /> Rectangle</button>
            <button type="button" onClick={() => addRect('whiteout')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><Eraser size={14} /> Masquer</button>
            <button type="button" onClick={() => addRect('redact')} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"><Square size={14} fill="currentColor" /> Caviarder</button>
            <button type="button" onClick={() => setMode('draw')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${mode === 'draw' ? 'bg-white text-gray-950' : 'bg-white/10 hover:bg-white/15'}`}><PenLine size={14} /> Dessiner</button>
          </div>

          {rotation !== 0 && <p className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">La page est tournée de {rotation}°. L’éditeur affiche l’orientation source ; les éléments suivront automatiquement la rotation lors de l’export.</p>}

          <div className="flex flex-1 items-start justify-center overflow-auto p-4 md:p-8">
            <div
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className={`relative w-full bg-white shadow-2xl ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
              style={{ aspectRatio: `${Math.max(pageWidth, 1)} / ${Math.max(pageHeight, 1)}`, maxWidth: pageWidth >= pageHeight ? 960 : 720, touchAction: 'none' }}
            >
              <img src={previewUrl} alt={label} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" />

              {draft.map(overlay => {
                if (overlay.kind === 'draw') {
                  if (overlay.points.length < 2) return null;
                  return (
                    <svg key={overlay.id} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ pointerEvents: mode === 'draw' ? 'none' : 'auto' }}>
                      <polyline
                        points={overlay.points.map(point => `${point.x},${point.y}`).join(' ')}
                        fill="none"
                        stroke={overlay.color}
                        strokeOpacity={overlay.opacity}
                        strokeWidth={Math.max(0.12, overlay.thickness * 0.18)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        onPointerDown={event => { if (mode === 'select') { event.stopPropagation(); setSelectedId(overlay.id); } }}
                        className={selectedId === overlay.id ? 'drop-shadow-[0_0_2px_rgba(37,99,235,0.9)]' : ''}
                      />
                    </svg>
                  );
                }

                const active = selectedId === overlay.id;
                return (
                  <div
                    key={overlay.id}
                    style={overlayStyle(overlay)}
                    onPointerDown={event => beginInteraction(event, overlay, 'move')}
                    className={`absolute select-none ${active ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-blue-400/70'} ${mode === 'select' ? 'cursor-move' : ''}`}
                  >
                    {overlay.kind === 'text' && (
                      <div
                        className={`h-full w-full overflow-hidden whitespace-pre-wrap ${overlay.bold ? 'font-bold' : 'font-normal'}`}
                        style={{ color: overlay.color, fontSize: `${Math.max(7, overlay.fontSize * previewScale)}px`, lineHeight: 1.2, textAlign: overlay.align }}
                      >{overlay.text}</div>
                    )}
                    {overlay.kind === 'image' && <OverlayImage file={overlay.file} />}
                    {overlay.kind === 'rect' && <div className="h-full w-full" style={{ backgroundColor: overlay.fill ? overlay.color : 'transparent', border: overlay.fill ? undefined : `${Math.max(1, overlay.borderWidth * previewScale)}px solid ${overlay.color}` }} />}
                    {active && (
                      <button
                        type="button"
                        aria-label="Redimensionner"
                        onPointerDown={event => beginInteraction(event, overlay, 'resize')}
                        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-blue-600 shadow"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto border-l border-gray-200 bg-white p-4 md:p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Page</p>
            <p className="mt-1 text-sm font-medium text-gray-800">{draft.length} élément{draft.length > 1 ? 's' : ''} ajouté{draft.length > 1 ? 's' : ''}</p>
          </div>

          {!selected && <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-6 text-gray-500">Sélectionnez un élément sur la page pour modifier sa taille, sa couleur, sa position ou son contenu. Les flèches du clavier permettent un placement précis.</div>}

          {selected && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sélection</p><p className="mt-1 text-sm font-semibold text-gray-900">{selected.kind === 'text' ? 'Texte' : selected.kind === 'image' ? 'Image / signature' : selected.kind === 'rect' ? 'Forme' : 'Dessin libre'}</p></div>
                <button type="button" onClick={removeSelected} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50" aria-label="Supprimer"><Trash2 size={16} /></button>
              </div>

              {selected.kind === 'text' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-600">Contenu<textarea value={selected.text} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'text' ? { ...overlay, text: event.target.value } : overlay)} className="mt-1 h-24 w-full rounded-lg border border-gray-200 p-2.5 text-sm" /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-medium text-gray-600">Taille<input type="number" min="6" max="96" value={selected.fontSize} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'text' ? { ...overlay, fontSize: clamp(Number(event.target.value) || 6, 6, 96) } : overlay)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm" /></label>
                    <label className="text-xs font-medium text-gray-600">Couleur<input type="color" value={selected.color} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'text' ? { ...overlay, color: event.target.value } : overlay)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 p-1" /></label>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateOverlay(selected.id, overlay => overlay.kind === 'text' ? { ...overlay, bold: !overlay.bold } : overlay)} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold ${selected.bold ? 'bg-gray-950 text-white' : 'bg-white'}`}>B</button>
                    {(['left', 'center', 'right'] as const).map(alignment => {
                      const Icon = alignment === 'left' ? AlignLeft : alignment === 'center' ? AlignCenter : AlignRight;
                      return <button key={alignment} type="button" onClick={() => updateOverlay(selected.id, overlay => overlay.kind === 'text' ? { ...overlay, align: alignment } : overlay)} className={`rounded-lg border p-2 ${selected.align === alignment ? 'bg-gray-950 text-white' : 'bg-white'}`}><Icon size={16} /></button>;
                    })}
                  </div>
                </div>
              )}

              {selected.kind === 'rect' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-gray-600">Couleur<input type="color" value={selected.color} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'rect' ? { ...overlay, color: event.target.value } : overlay)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 p-1" /></label>
                  {!selected.fill && <label className="text-xs font-medium text-gray-600">Contour<input type="number" min="0.5" max="16" step="0.5" value={selected.borderWidth} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'rect' ? { ...overlay, borderWidth: clamp(Number(event.target.value) || 1, 0.5, 16) } : overlay)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm" /></label>}
                </div>
              )}

              {selected.kind === 'draw' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-gray-600">Couleur<input type="color" value={selected.color} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'draw' ? { ...overlay, color: event.target.value } : overlay)} className="mt-1 h-9 w-full rounded-lg border border-gray-200 p-1" /></label>
                  <label className="text-xs font-medium text-gray-600">Épaisseur<input type="number" min="0.5" max="24" step="0.5" value={selected.thickness} onChange={event => updateOverlay(selected.id, overlay => overlay.kind === 'draw' ? { ...overlay, thickness: clamp(Number(event.target.value) || 1, 0.5, 24) } : overlay)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm" /></label>
                </div>
              )}

              <label className="block text-xs font-medium text-gray-600">Opacité · {Math.round(selected.opacity * 100)}%<input type="range" min="10" max="100" value={Math.round(selected.opacity * 100)} onChange={event => updateOverlay(selected.id, overlay => ({ ...overlay, opacity: Number(event.target.value) / 100 }))} className="mt-1 w-full" /></label>

              {isPositioned(selected) && (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3">
                  <label className="text-[11px] font-medium text-gray-500">X %<input type="number" min="0" max="100" step="0.1" value={selected.x.toFixed(1)} onChange={event => updateOverlay(selected.id, overlay => isPositioned(overlay) ? { ...overlay, x: clamp(Number(event.target.value) || 0, 0, 100 - overlay.width) } : overlay)} className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] font-medium text-gray-500">Y %<input type="number" min="0" max="100" step="0.1" value={selected.y.toFixed(1)} onChange={event => updateOverlay(selected.id, overlay => isPositioned(overlay) ? { ...overlay, y: clamp(Number(event.target.value) || 0, 0, 100 - overlay.height) } : overlay)} className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] font-medium text-gray-500">Largeur %<input type="number" min="3" max="100" step="0.1" value={selected.width.toFixed(1)} onChange={event => updateOverlay(selected.id, overlay => isPositioned(overlay) ? { ...overlay, width: clamp(Number(event.target.value) || 3, 3, 100 - overlay.x) } : overlay)} className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] font-medium text-gray-500">Hauteur %<input type="number" min="2" max="100" step="0.1" value={selected.height.toFixed(1)} onChange={event => updateOverlay(selected.id, overlay => isPositioned(overlay) ? { ...overlay, height: clamp(Number(event.target.value) || 2, 2, 100 - overlay.y) } : overlay)} className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs" /></label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={duplicateSelected} className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium"><Copy size={14} /> Dupliquer</button>
                <button type="button" onClick={() => reorderSelected('front')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium"><ArrowUpToLine size={14} /> Devant</button>
                <button type="button" onClick={() => reorderSelected('back')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium"><ArrowDownToLine size={14} /> Derrière</button>
                <button type="button" onClick={removeSelected} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-2 py-2 text-xs font-medium text-red-600"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>
          )}

          {draft.length > 0 && <button type="button" onClick={() => { setDraft([]); setSelectedId(null); }} className="mt-6 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50">Effacer tous les éléments de cette page</button>}
        </aside>
      </div>
    </div>
  );
}
