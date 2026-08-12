import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckSquare2,
  ChevronDown,
  CircleDot,
  Copy,
  Download,
  FileInput,
  FileSignature,
  FormInput,
  GripVertical,
  ListChecks,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { createPdfPagePreviews, type PdfPagePreview, type PdfOutput } from '../services/pdfTools';
import {
  applyPdfFormEdits,
  inspectPdfForm,
  type NewPdfFormField,
  type NewPdfFormFieldType,
  type PdfFormFieldSnapshot,
  type PdfFormInspection,
  type PdfFormValue,
} from '../services/pdfForms';

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const fieldMeta: Record<NewPdfFormFieldType, { label: string; icon: typeof Type }> = {
  text: { label: 'Champ texte', icon: Type },
  checkbox: { label: 'Case à cocher', icon: CheckSquare2 },
  radio: { label: 'Boutons radio', icon: CircleDot },
  dropdown: { label: 'Liste déroulante', icon: ChevronDown },
};

function initialValues(inspection: PdfFormInspection): Record<string, PdfFormValue> {
  return Object.fromEntries(inspection.fields.map(field => [field.name, field.value]));
}

function existingTypeLabel(type: PdfFormFieldSnapshot['type']): string {
  const labels: Record<PdfFormFieldSnapshot['type'], string> = {
    text: 'Texte',
    checkbox: 'Case à cocher',
    radio: 'Choix unique',
    dropdown: 'Liste déroulante',
    list: 'Liste',
    button: 'Bouton',
    signature: 'Signature numérique',
    unknown: 'Champ',
  };
  return labels[type];
}

export default function PdfFormEditor({ file }: { file: File }) {
  const [inspection, setInspection] = useState<PdfFormInspection | null>(null);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [values, setValues] = useState<Record<string, PdfFormValue>>({});
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set());
  const [newFields, setNewFields] = useState<NewPdfFormField[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'existing' | 'create'>('existing');
  const [search, setSearch] = useState('');
  const [flatten, setFlatten] = useState(false);
  const [removeXfa, setRemoveXfa] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const previewUrls = useRef<string[]>([]);
  const outputUrl = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([inspectPdfForm(file), createPdfPagePreviews([file], 0.9)])
      .then(([nextInspection, nextPreviews]) => {
        if (cancelled) {
          nextPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
          return;
        }
        previewUrls.current = nextPreviews.map(preview => preview.url);
        setInspection(nextInspection);
        setPreviews(nextPreviews);
        setValues(initialValues(nextInspection));
        setActivePage(1);
        setRemovedFields(new Set());
        setNewFields([]);
        setSelectedFieldId(null);
        setRemoveXfa(false);
        setFlatten(false);
      })
      .catch(caught => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Impossible de lire les champs de ce PDF.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      previewUrls.current.forEach(URL.revokeObjectURL);
      previewUrls.current = [];
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
      outputUrl.current = null;
    };
  }, [file]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / Math.max(1, drag.stageWidth) * 100;
      const dy = (event.clientY - drag.startY) / Math.max(1, drag.stageHeight) * 100;
      setNewFields(current => current.map(field => {
        if (field.id !== drag.id) return field;
        if (drag.mode === 'move') {
          return {
            ...field,
            x: clamp(drag.x + dx, 0, Math.max(0, 100 - field.width)),
            y: clamp(drag.y + dy, 0, Math.max(0, 100 - field.height)),
          };
        }
        const width = clamp(drag.width + dx, 3, Math.max(3, 100 - field.x));
        const height = clamp(drag.height + dy, 2, Math.max(2, 100 - field.y));
        return { ...field, width, height };
      }));
    };
    const handleUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const activePreview = previews.find(preview => preview.pageNumber === activePage);
  const selectedField = newFields.find(field => field.id === selectedFieldId) ?? null;

  const filteredExisting = useMemo(() => {
    if (!inspection) return [];
    const term = search.trim().toLowerCase();
    if (!term) return inspection.fields;
    return inspection.fields.filter(field => `${field.name} ${existingTypeLabel(field.type)}`.toLowerCase().includes(term));
  }, [inspection, search]);

  const updateExistingValue = (name: string, value: PdfFormValue) => {
    setValues(current => ({ ...current, [name]: value }));
  };

  const toggleRemoved = (name: string) => {
    setRemovedFields(current => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const nextFieldName = (type: NewPdfFormFieldType) => {
    const base = `doxali.${type}`;
    const existing = new Set([...(inspection?.fields.map(field => field.name) ?? []), ...newFields.map(field => field.name)]);
    let index = 1;
    while (existing.has(`${base}.${index}`)) index += 1;
    return `${base}.${index}`;
  };

  const addField = (type: NewPdfFormFieldType) => {
    const countOnPage = newFields.filter(field => field.page === activePage).length;
    const offset = (countOnPage * 3) % 30;
    const compact = type === 'checkbox';
    const field: NewPdfFormField = {
      id: crypto.randomUUID(),
      type,
      name: nextFieldName(type),
      label: type === 'text' ? 'Votre texte' : type === 'checkbox' ? 'J’accepte' : type === 'radio' ? 'Choisissez une option' : 'Sélectionnez',
      page: activePage,
      x: 12 + offset,
      y: 15 + offset,
      width: compact ? 5 : type === 'radio' ? 42 : 34,
      height: compact ? 5 : type === 'radio' ? 7 : 6,
      options: type === 'radio' ? ['Oui', 'Non'] : type === 'dropdown' ? ['Option 1', 'Option 2', 'Option 3'] : [],
      defaultValue: '',
      checked: false,
      multiline: false,
      required: false,
    };
    setNewFields(current => [...current, field]);
    setSelectedFieldId(field.id);
    setPanel('create');
  };

  const updateNewField = (id: string, patch: Partial<NewPdfFormField>) => {
    setNewFields(current => current.map(field => field.id === id ? { ...field, ...patch } : field));
  };

  const removeNewField = (id: string) => {
    setNewFields(current => current.filter(field => field.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const duplicateNewField = (field: NewPdfFormField) => {
    const duplicate = {
      ...field,
      id: crypto.randomUUID(),
      name: nextFieldName(field.type),
      x: clamp(field.x + 3, 0, Math.max(0, 100 - field.width)),
      y: clamp(field.y + 3, 0, Math.max(0, 100 - field.height)),
    };
    setNewFields(current => [...current, duplicate]);
    setSelectedFieldId(duplicate.id);
  };

  const beginDrag = (event: React.PointerEvent, field: NewPdfFormField, mode: DragState['mode']) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedFieldId(field.id);
    dragRef.current = {
      id: field.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
  };

  const nudgeField = (event: React.KeyboardEvent, field: NewPdfFormField) => {
    const step = event.shiftKey ? 2 : 0.5;
    const patch: Partial<NewPdfFormField> = {};
    if (event.key === 'ArrowLeft') patch.x = clamp(field.x - step, 0, 100 - field.width);
    else if (event.key === 'ArrowRight') patch.x = clamp(field.x + step, 0, 100 - field.width);
    else if (event.key === 'ArrowUp') patch.y = clamp(field.y - step, 0, 100 - field.height);
    else if (event.key === 'ArrowDown') patch.y = clamp(field.y + step, 0, 100 - field.height);
    else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeNewField(field.id);
      return;
    } else return;
    event.preventDefault();
    updateNewField(field.id, patch);
  };

  const reset = () => {
    if (!inspection) return;
    setValues(initialValues(inspection));
    setRemovedFields(new Set());
    setNewFields([]);
    setSelectedFieldId(null);
    setFlatten(false);
    setRemoveXfa(false);
    setError(null);
  };

  const save = async () => {
    if (!inspection) return;
    setBusy(true);
    setError(null);
    try {
      const next = await applyPdfFormEdits(file, {
        values,
        removedFields: Array.from(removedFields),
        newFields,
        flatten,
        removeXfa,
      });
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
      outputUrl.current = next.url;
      setOutput(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de générer le formulaire PDF.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-10 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Analyse des champs du formulaire…</div>;
  }

  if (!inspection) {
    return <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error ?? 'Impossible de charger ce formulaire PDF.'}</div>;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm" aria-label="Éditeur de formulaires PDF">
      <div className="border-b border-gray-100 bg-gray-50/60 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Éditeur de formulaire</h2>
            <p className="mt-1 text-sm text-gray-500">Remplissez les champs existants ou ajoutez vos propres champs directement sur les pages.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5"><strong>{inspection.fields.length}</strong> champ{inspection.fields.length > 1 ? 's' : ''} détecté{inspection.fields.length > 1 ? 's' : ''}</span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5"><strong>{newFields.length}</strong> ajouté{newFields.length > 1 ? 's' : ''}</span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5"><strong>{inspection.pageCount}</strong> page{inspection.pageCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {inspection.hasXfa && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ce PDF contient des données XFA. Les champs XFA ne sont pas éditables ici. Vous pouvez conserver XFA ou le retirer pour privilégier les champs PDF standards.
          </div>
        )}
        {inspection.signatureCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            <FileSignature size={17} className="mt-0.5 shrink-0" />
            <span>{inspection.signatureCount} champ{inspection.signatureCount > 1 ? 's' : ''} de signature numérique détecté{inspection.signatureCount > 1 ? 's' : ''}. Vérifiez les signatures existantes après toute modification du document.</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 p-4 md:p-5 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setPanel('existing')} className={`rounded-lg px-3 py-2 text-sm font-medium ${panel === 'existing' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500'}`}>Champs existants</button>
            <button type="button" onClick={() => setPanel('create')} className={`rounded-lg px-3 py-2 text-sm font-medium ${panel === 'create' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500'}`}>Ajouter des champs</button>
          </div>

          {panel === 'existing' ? (
            <div className="mt-4">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un champ…" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400" />
              </div>

              <div className="mt-3 max-h-[42rem] space-y-3 overflow-auto pr-1">
                {filteredExisting.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">Aucun champ interactif détecté. Passez dans « Ajouter des champs » pour créer votre formulaire.</div>
                )}
                {filteredExisting.map(field => {
                  const removed = removedFields.has(field.name);
                  const currentValue = values[field.name];
                  return (
                    <article key={field.name} className={`rounded-xl border p-3 transition ${removed ? 'border-red-100 bg-red-50/50 opacity-60' : 'border-gray-200 bg-white'}`}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900" title={field.name}>{field.name}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{existingTypeLabel(field.type)}{field.required ? ' · obligatoire' : ''}{field.readOnly ? ' · lecture seule' : ''}</p>
                        </div>
                        <button type="button" onClick={() => toggleRemoved(field.name)} className={`shrink-0 rounded-lg p-1.5 ${removed ? 'text-gray-600 hover:bg-white' : 'text-red-500 hover:bg-red-50'}`} title={removed ? 'Restaurer ce champ' : 'Supprimer ce champ'}>{removed ? <RotateCcw size={15} /> : <Trash2 size={15} />}</button>
                      </div>

                      {!removed && field.type === 'text' && (field.multiline ? (
                        <textarea value={typeof currentValue === 'string' ? currentValue : ''} onChange={event => updateExistingValue(field.name, event.target.value)} className="h-24 w-full resize-y rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-gray-400" />
                      ) : (
                        <input value={typeof currentValue === 'string' ? currentValue : ''} onChange={event => updateExistingValue(field.name, event.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-gray-400" />
                      ))}

                      {!removed && field.type === 'checkbox' && (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-700"><input type="checkbox" checked={currentValue === true} onChange={event => updateExistingValue(field.name, event.target.checked)} /> {currentValue === true ? 'Cochée' : 'Non cochée'}</label>
                      )}

                      {!removed && (field.type === 'radio' || field.type === 'dropdown') && (
                        <select value={typeof currentValue === 'string' ? currentValue : Array.isArray(currentValue) ? currentValue[0] ?? '' : ''} onChange={event => updateExistingValue(field.name, event.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm">
                          <option value="">Aucune sélection</option>
                          {field.options.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      )}

                      {!removed && field.type === 'list' && (
                        <div className="space-y-1 rounded-lg bg-gray-50 p-2">
                          {field.options.map(option => {
                            const selected = Array.isArray(currentValue) && currentValue.includes(option);
                            return <label key={option} className="flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" checked={selected} onChange={event => {
                              const valuesList = Array.isArray(currentValue) ? currentValue : [];
                              updateExistingValue(field.name, event.target.checked ? [...valuesList, option] : valuesList.filter(value => value !== option));
                            }} /> {option}</label>;
                          })}
                        </div>
                      )}

                      {!removed && (field.type === 'signature' || field.type === 'button' || field.type === 'unknown') && (
                        <p className="rounded-lg bg-gray-50 p-2 text-xs leading-5 text-gray-500">Ce type de champ est conservé tel quel. Il n’est pas modifié depuis ce panneau.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ajouter sur la page {activePage}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.entries(fieldMeta) as Array<[NewPdfFormFieldType, (typeof fieldMeta)[NewPdfFormFieldType]]>).map(([type, meta]) => (
                  <button key={type} type="button" onClick={() => addField(type)} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-left text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"><meta.icon size={16} /> {meta.label}</button>
                ))}
              </div>

              {selectedField ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold text-gray-900">{fieldMeta[selectedField.type].label}</p><p className="text-[11px] text-gray-500">Page {selectedField.page}</p></div><button type="button" onClick={() => setSelectedFieldId(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-white"><X size={15} /></button></div>
                  <label className="block text-xs font-medium text-gray-600">Nom technique<input value={selectedField.name} onChange={event => updateNewField(selectedField.id, { name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm" /></label>
                  <label className="block text-xs font-medium text-gray-600">Libellé visible<input value={selectedField.label} onChange={event => updateNewField(selectedField.id, { label: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm" /></label>

                  {(selectedField.type === 'radio' || selectedField.type === 'dropdown') && (
                    <label className="block text-xs font-medium text-gray-600">Options<textarea value={selectedField.options.join('\n')} onChange={event => updateNewField(selectedField.id, { options: event.target.value.split('\n') })} className="mt-1 h-24 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm" placeholder="Une option par ligne" /></label>
                  )}

                  {selectedField.type === 'text' && <label className="block text-xs font-medium text-gray-600">Valeur initiale<input value={selectedField.defaultValue} onChange={event => updateNewField(selectedField.id, { defaultValue: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm" /></label>}
                  {(selectedField.type === 'radio' || selectedField.type === 'dropdown') && <label className="block text-xs font-medium text-gray-600">Valeur initiale<select value={selectedField.defaultValue} onChange={event => updateNewField(selectedField.id, { defaultValue: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm"><option value="">Aucune</option>{selectedField.options.filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}</select></label>}
                  {selectedField.type === 'checkbox' && <label className="flex items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" checked={selectedField.checked} onChange={event => updateNewField(selectedField.id, { checked: event.target.checked })} /> Cochée par défaut</label>}
                  {selectedField.type === 'text' && <label className="flex items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" checked={selectedField.multiline} onChange={event => updateNewField(selectedField.id, { multiline: event.target.checked })} /> Texte multiligne</label>}
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" checked={selectedField.required} onChange={event => updateNewField(selectedField.id, { required: event.target.checked })} /> Champ obligatoire</label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label>X %<input type="number" min="0" max="100" step="0.5" value={selectedField.x.toFixed(1)} onChange={event => updateNewField(selectedField.id, { x: clamp(Number(event.target.value), 0, 100 - selectedField.width) })} className="mt-1 w-full rounded-lg border bg-white p-2" /></label>
                    <label>Y %<input type="number" min="0" max="100" step="0.5" value={selectedField.y.toFixed(1)} onChange={event => updateNewField(selectedField.id, { y: clamp(Number(event.target.value), 0, 100 - selectedField.height) })} className="mt-1 w-full rounded-lg border bg-white p-2" /></label>
                    <label>Largeur %<input type="number" min="3" max="95" step="0.5" value={selectedField.width.toFixed(1)} onChange={event => updateNewField(selectedField.id, { width: clamp(Number(event.target.value), 3, 100 - selectedField.x) })} className="mt-1 w-full rounded-lg border bg-white p-2" /></label>
                    <label>Hauteur %<input type="number" min="2" max="95" step="0.5" value={selectedField.height.toFixed(1)} onChange={event => updateNewField(selectedField.id, { height: clamp(Number(event.target.value), 2, 100 - selectedField.y) })} className="mt-1 w-full rounded-lg border bg-white p-2" /></label>
                  </div>

                  <div className="flex gap-2 border-t border-blue-100 pt-3">
                    <button type="button" onClick={() => duplicateNewField(selectedField)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium"><Copy size={14} /> Dupliquer</button>
                    <button type="button" onClick={() => removeNewField(selectedField.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-medium text-red-600"><Trash2 size={14} /> Supprimer</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs leading-5 text-gray-500">Ajoutez un champ puis sélectionnez-le sur la page pour régler sa position, sa taille et ses options.</div>
              )}
            </div>
          )}
        </aside>

        <div className="min-w-0 bg-gray-100/70 p-4 md:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {previews.map(preview => (
              <button key={preview.pageNumber} type="button" onClick={() => { setActivePage(preview.pageNumber); setSelectedFieldId(null); }} className={`relative w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white ${activePage === preview.pageNumber ? 'border-blue-600' : 'border-transparent'}`}>
                <img src={preview.url} alt={`Page ${preview.pageNumber}`} className="aspect-[3/4] w-full object-contain" />
                <span className="block border-t border-gray-100 py-1 text-[10px] font-medium text-gray-600">Page {preview.pageNumber}</span>
                {newFields.some(field => field.page === preview.pageNumber) && <span className="absolute right-1 top-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{newFields.filter(field => field.page === preview.pageNumber).length}</span>}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-4xl">
            {activePreview && (
              <div ref={stageRef} onClick={() => setSelectedFieldId(null)} className="relative overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
                <img src={activePreview.url} alt={`Aperçu page ${activePage}`} className="block h-auto w-full select-none" draggable={false} />
                {newFields.filter(field => field.page === activePage).map(field => {
                  const selected = field.id === selectedFieldId;
                  const Icon = fieldMeta[field.type].icon;
                  return (
                    <div
                      key={field.id}
                      role="button"
                      tabIndex={0}
                      onClick={event => { event.stopPropagation(); setSelectedFieldId(field.id); setPanel('create'); }}
                      onPointerDown={event => beginDrag(event, field, 'move')}
                      onKeyDown={event => nudgeField(event, field)}
                      style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, height: `${field.height}%` }}
                      className={`absolute flex cursor-move touch-none items-center overflow-hidden border-2 bg-blue-50/85 text-blue-900 shadow-sm outline-none ${selected ? 'z-20 border-blue-600 ring-2 ring-blue-500/20' : 'z-10 border-blue-400/70 hover:border-blue-600'}`}
                      title="Glissez pour déplacer · flèches pour ajuster"
                    >
                      <span className="flex min-w-0 items-center gap-1 px-1.5 text-[10px] font-semibold md:text-xs"><GripVertical size={12} className="shrink-0" /><Icon size={12} className="shrink-0" /><span className="truncate">{field.label || fieldMeta[field.type].label}</span></span>
                      {selected && <button type="button" aria-label="Redimensionner le champ" onPointerDown={event => beginDrag(event, field, 'resize')} className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize border-l border-t border-blue-600 bg-blue-600" />}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-gray-500">Les rectangles bleus représentent uniquement les nouveaux champs. Glissez-les, redimensionnez-les avec la poignée et utilisez les flèches pour un réglage fin.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-5 md:p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-700"><input type="checkbox" checked={flatten} onChange={event => setFlatten(event.target.checked)} className="mt-1" /><span><strong className="block text-gray-900">Aplatir le formulaire à la fin</strong><span className="mt-0.5 block text-xs leading-5 text-gray-500">Les valeurs deviennent du contenu fixe et les champs ne seront plus modifiables dans un lecteur PDF.</span></span></label>
          {inspection.hasXfa && <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-900"><input type="checkbox" checked={removeXfa} onChange={event => setRemoveXfa(event.target.checked)} className="mt-1" /><span><strong className="block">Retirer les données XFA</strong><span className="mt-0.5 block text-xs leading-5 text-amber-700">Conserve les champs PDF standards et évite que XFA ne prenne le dessus dans certains lecteurs.</span></span></label>}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={reset} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><RotateCcw size={16} /> Réinitialiser</button>
          <button type="button" onClick={() => void save()} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300">{busy ? <><Loader2 size={17} className="animate-spin" /> Génération du formulaire…</> : <><FormInput size={17} /> Générer le PDF</>}</button>
        </div>
      </div>

      {output && (
        <div className="border-t border-emerald-100 bg-emerald-50/40 p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold text-gray-950">Formulaire généré</p><p className="mt-1 text-xs text-gray-500">Vérifiez le résultat avant de le télécharger.</p></div>
            <a href={output.url} download={output.name} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white"><Download size={16} /> Télécharger</a>
          </div>
          <iframe src={`${output.url}#toolbar=1&navpanes=0`} title="Aperçu du formulaire PDF généré" className="h-[34rem] w-full rounded-xl border border-gray-200 bg-white" />
        </div>
      )}
    </section>
  );
}
