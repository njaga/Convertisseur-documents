import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Accept } from 'react-dropzone';
import { ArrowDown, ArrowUp, Download, FileImage, FormInput, Images, ListOrdered, Loader2, Merge, RotateCw, Scissors, ShieldCheck, X } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import FilePreview from '../components/FilePreview';
import PdfFormEditor from '../components/PdfFormEditor';
import PdfVisualEditor from '../components/PdfVisualEditor';
import { createPdfPagePreviews, getPdfPageCount, imagesToPdf, mergePdfs, organizePdf, pdfToPngs, PdfOutput, PdfPagePreview, rotatePdf, splitPdf } from '../services/pdfTools';

type Tool = 'editor' | 'forms' | 'images' | 'render' | 'merge' | 'split' | 'rotate' | 'organize';
type LocationState = { initialFile?: File } | null;

type ToolDefinition = {
  id: Tool;
  path: string;
  label: string;
  title: string;
  description: string;
  action: string;
  icon: typeof FileImage;
};

const tools: ToolDefinition[] = [
  { id: 'merge', path: '/fusionner-pdf', label: 'Fusionner', title: 'Fusionner des fichiers PDF', description: 'Combinez plusieurs PDF et choisissez leur ordre avant de créer un seul document.', action: 'Fusionner les PDF', icon: Merge },
  { id: 'split', path: '/diviser-pdf', label: 'Diviser', title: 'Diviser un fichier PDF', description: 'Séparez votre document pour obtenir un fichier PDF indépendant pour chaque page.', action: 'Diviser le PDF', icon: Scissors },
  { id: 'editor', path: '/modifier-pdf', label: 'Modifier', title: 'Modifier un PDF', description: 'Ajoutez du texte, des images, des annotations et des dessins, puis réorganisez les pages visuellement.', action: 'Modifier le PDF', icon: ListOrdered },
  { id: 'forms', path: '/formulaires-pdf', label: 'Formulaires', title: 'Remplir et créer des formulaires PDF', description: 'Détectez les champs existants, remplissez-les et ajoutez visuellement vos propres champs interactifs.', action: 'Modifier le formulaire', icon: FormInput },
  { id: 'organize', path: '/organiser-pdf', label: 'Organiser', title: 'Organiser les pages d’un PDF', description: 'Choisissez précisément les pages à conserver et l’ordre dans lequel elles doivent apparaître.', action: 'Organiser le PDF', icon: ListOrdered },
  { id: 'rotate', path: '/pivoter-pdf', label: 'Pivoter', title: 'Faire pivoter un PDF', description: 'Tournez toutes les pages de votre PDF à 90°, 180° ou 270°.', action: 'Faire pivoter le PDF', icon: RotateCw },
  { id: 'render', path: '/pdf-en-png', label: 'PDF → PNG', title: 'Convertir un PDF en PNG', description: 'Transformez chaque page de votre document en image PNG haute résolution.', action: 'Convertir en PNG', icon: Images },
  { id: 'images', path: '/images-en-pdf', label: 'Images → PDF', title: 'Convertir des images en PDF', description: 'Regroupez vos images PNG, JPG, WebP ou ICO dans un document PDF.', action: 'Créer le PDF', icon: FileImage },
];

const validTools = new Set<Tool>(tools.map(item => item.id));
const pathToTool = new Map<string, Tool>(tools.map(item => [item.path, item.id]));
const isTool = (value: string | null): value is Tool => Boolean(value && validTools.has(value as Tool));
const hasOwnPreview = (tool: Tool) => tool === 'editor' || tool === 'forms';

const PdfTools = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFile = (location.state as LocationState)?.initialFile;
  const [fallbackTool] = useState<Tool>(initialFile ? 'editor' : 'merge');
  const pathTool = pathToTool.get(location.pathname);
  const requestedTool = pathTool ?? searchParams.get('tool');
  const tool: Tool = isTool(requestedTool) ? requestedTool : fallbackTool;
  const selectedTool = tools.find(item => item.id === tool) ?? tools[0];

  const [files, setFiles] = useState<File[]>(initialFile ? [initialFile] : []);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState('');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [outputs, setOutputs] = useState<PdfOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(Boolean(initialFile));
  const urlsRef = useRef<Set<string>>(new Set());
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = urlsRef.current;
    const previewUrls = previewUrlsRef.current;
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
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

    document.title = `${selectedTool.title} gratuitement | Doxali`;
    meta.setAttribute('content', `${selectedTool.description} Outil gratuit, sans inscription et avec traitement local en priorité.`);
    canonical.setAttribute('href', `${window.location.origin}${selectedTool.path}`);

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
  }, [selectedTool]);

  useEffect(() => {
    if (!files.length || tool === 'images' || hasOwnPreview(tool)) return;

    let cancelled = false;
    createPdfPagePreviews(files)
      .then(next => {
        if (cancelled) {
          next.forEach(preview => URL.revokeObjectURL(preview.url));
          return;
        }
        next.forEach(preview => previewUrlsRef.current.add(preview.url));
        setPreviews(next);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de générer l’aperçu de certaines pages.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPreviews(false);
      });
    return () => { cancelled = true; };
  }, [files, tool]);

  useEffect(() => {
    if (files.length !== 1 || tool === 'images' || tool === 'merge' || hasOwnPreview(tool)) return;

    let cancelled = false;
    getPdfPageCount(files[0])
      .then(count => {
        if (!cancelled) setPageCount(count);
      })
      .catch(() => {
        if (!cancelled) setPageCount(null);
      });

    return () => { cancelled = true; };
  }, [files, tool]);

  const resetResults = () => {
    outputs.forEach(output => {
      URL.revokeObjectURL(output.url);
      urlsRef.current.delete(output.url);
    });
    setOutputs([]);
    setError(null);
  };

  const clearPreviews = () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setPreviews([]);
  };

  const changeTool = (next: Tool) => {
    resetResults();
    clearPreviews();
    setFiles([]);
    setPageSelection('');
    setPageCount(null);
    setLoadingPreviews(false);
    const destination = tools.find(item => item.id === next)?.path ?? '/fusionner-pdf';
    navigate(destination);
  };

  const handleFiles = (selected: File[]) => {
    resetResults();
    clearPreviews();
    setPageCount(null);
    const invalid = selected.find(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (tool === 'images') return !['png', 'jpg', 'jpeg', 'webp', 'ico'].includes(extension ?? '');
      return extension !== 'pdf';
    });
    if (invalid) {
      setFiles([]);
      setError(`Le fichier ${invalid.name} n'est pas valide pour cet outil.`);
      return;
    }
    setLoadingPreviews(tool !== 'images' && !hasOwnPreview(tool) && selected.length > 0);
    setFiles(selected);
  };

  const removeFile = (index: number) => {
    resetResults();
    clearPreviews();
    const next = files.filter((_, fileIndex) => fileIndex !== index);
    setLoadingPreviews(tool !== 'images' && !hasOwnPreview(tool) && next.length > 0);
    setFiles(next);
    setPageCount(null);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    clearPreviews();
    setLoadingPreviews(tool !== 'images');
    setFiles(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const selectPreviewPage = (pageNumber: number) => {
    if (tool !== 'organize') return;
    setPageSelection(current => current ? `${current},${pageNumber}` : String(pageNumber));
  };

  const runTool = async () => {
    resetResults();
    setProcessing(true);
    try {
      let result: PdfOutput[];
      if (tool === 'images') result = [await imagesToPdf(files)];
      else if (tool === 'render') {
        if (files.length !== 1) throw new Error('Sélectionnez un seul PDF à convertir en images.');
        result = await pdfToPngs(files[0]);
      } else if (tool === 'merge') result = [await mergePdfs(files)];
      else if (tool === 'split') {
        if (files.length !== 1) throw new Error('Sélectionnez un seul PDF à séparer.');
        result = await splitPdf(files[0]);
      } else if (tool === 'rotate') {
        if (files.length !== 1) throw new Error('Sélectionnez un seul PDF à faire pivoter.');
        result = [await rotatePdf(files[0], rotation)];
      } else {
        if (files.length !== 1) throw new Error('Sélectionnez un seul PDF à organiser.');
        result = [await organizePdf(files[0], pageSelection)];
      }

      result.forEach(output => urlsRef.current.add(output.url));
      setOutputs(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Une erreur inattendue est survenue.');
    } finally {
      setProcessing(false);
    }
  };

  const acceptsImages = tool === 'images';
  const multiple = tool === 'images' || tool === 'merge';
  const canRun = hasOwnPreview(tool)
    ? false
    : tool === 'images'
      ? files.length >= 1
      : tool === 'merge'
        ? files.length >= 2
        : tool === 'organize'
          ? files.length === 1 && pageSelection.trim().length > 0
          : files.length === 1;

  const accept: Accept = acceptsImages
    ? { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/x-icon': ['.ico'] }
    : { 'application/pdf': ['.pdf'] };

  const uploadTitle = acceptsImages
    ? 'Sélectionner les images'
    : multiple
      ? 'Sélectionner les fichiers PDF'
      : tool === 'editor'
        ? 'Sélectionner le PDF à modifier'
        : tool === 'forms'
          ? 'Sélectionner le formulaire PDF'
          : 'Sélectionner le fichier PDF';

  const uploadHint = acceptsImages
    ? 'ou glissez-déposez vos images ici · PNG, JPG, WebP ou ICO'
    : `ou glissez-déposez ${multiple ? 'vos PDF' : 'votre PDF'} ici · 150 MB max. par fichier`;

  return (
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            <ShieldCheck size={14} /> Traitement local, sans envoi vers un serveur
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">{selectedTool.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">{selectedTool.description}</p>
        </header>

        <div className="mx-auto max-w-3xl">
          {files.length === 0 && (
            <FileDropZone onFiles={handleFiles} accept={accept} multiple={multiple} title={uploadTitle} hint={uploadHint} />
          )}
        </div>

        <nav className="my-8 flex flex-wrap justify-center gap-2" aria-label="Autres outils PDF">
          {tools.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeTool(item.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${tool === item.id ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950'}`}
            >
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </nav>

        {files.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 md:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-950">{files.length} fichier{files.length > 1 ? 's' : ''} prêt{files.length > 1 ? 's' : ''}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {tool === 'merge'
                      ? 'L’ordre ci-dessous sera utilisé dans le PDF final.'
                      : tool === 'images'
                        ? 'Chaque image deviendra une page du PDF, dans l’ordre affiché ci-dessous.'
                        : 'Vous pouvez remplacer le fichier en recommençant la sélection.'}
                  </p>
                </div>
                <button type="button" onClick={() => handleFiles([])} className="text-sm font-medium text-red-600 hover:text-red-700">Tout retirer</button>
              </div>

              {tool === 'images' ? (
                <section aria-label="Aperçu et ordre des images">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Aperçu & ordre des pages</p>
                      <p className="mt-1 text-xs text-gray-500">Vérifiez vos images avant création du PDF. Utilisez les flèches pour changer l’ordre des pages.</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{files.length} page{files.length > 1 ? 's' : ''}</span>
                  </div>

                  <div className="grid max-h-[46rem] gap-3 overflow-auto rounded-2xl border border-gray-200 bg-gray-100 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((file, index) => (
                      <article key={`${file.name}-${file.size}-${file.lastModified}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="relative bg-gray-50 p-2">
                          <FilePreview file={file} className="!h-56 !rounded-xl !border-0 bg-white" />
                          <span className="absolute left-4 top-4 flex h-8 min-w-8 items-center justify-center rounded-full bg-gray-950 px-2 text-xs font-bold text-white shadow">{index + 1}</span>
                          <button type="button" onClick={() => removeFile(index)} aria-label={`Retirer ${file.name}`} title="Retirer cette image" className="absolute right-4 top-4 rounded-full bg-white/95 p-2 text-gray-600 shadow hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                        </div>
                        <div className="border-t border-gray-100 p-3">
                          <p className="truncate text-sm font-medium text-gray-800" title={file.name}>{file.name}</p>
                          <p className="mt-1 text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB · Page {index + 1}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={14} /> Monter</button>
                            <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown size={14} /> Descendre</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="space-y-2 rounded-2xl bg-gray-50 p-3">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{file.name}</span>
                      <span className="hidden text-xs text-gray-400 sm:block">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      {multiple && <>
                        <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0} aria-label="Monter" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ArrowUp size={15} /></button>
                        <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} aria-label="Descendre" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ArrowDown size={15} /></button>
                      </>}
                      <button type="button" onClick={() => removeFile(index)} aria-label={`Retirer ${file.name}`} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              )}

              {pageCount !== null && <p className="mt-2 text-xs text-gray-500">{pageCount} page{pageCount > 1 ? 's' : ''}</p>}

              <div className="mt-4">
                <FileDropZone onFiles={handleFiles} accept={accept} multiple={multiple} title={multiple ? 'Remplacer la sélection' : 'Choisir un autre fichier'} hint="Cliquez ou glissez-déposez pour remplacer les fichiers actuels" />
              </div>

              {files.length > 0 && tool !== 'images' && !hasOwnPreview(tool) && (
                <section className="mt-6" aria-label="Aperçu des pages">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Aperçu des pages</p>
                    {tool === 'organize' && <p className="text-xs text-gray-500">Cliquez dans l’ordre souhaité</p>}
                  </div>
                  {loadingPreviews ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Génération des aperçus…</div>
                  ) : (
                    <div className="grid max-h-[32rem] grid-cols-2 gap-3 overflow-auto rounded-2xl border border-gray-200 bg-gray-100 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {previews.map(preview => {
                        const selectedOrder = tool === 'organize' ? pageSelection.split(',').map(value => Number(value.trim())).lastIndexOf(preview.pageNumber) : -1;
                        return (
                          <button key={`${preview.fileIndex}-${preview.pageNumber}`} type="button" onClick={() => selectPreviewPage(preview.pageNumber)} disabled={tool !== 'organize'} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm disabled:cursor-default">
                            <img src={preview.url} alt={`Page ${preview.pageNumber} de ${files[preview.fileIndex]?.name}`} className="aspect-[3/4] w-full object-contain" />
                            <span className="block truncate border-t border-gray-100 px-2 py-1.5 text-[11px] text-gray-600">{tool === 'merge' ? `${preview.fileIndex + 1}. ` : ''}Page {preview.pageNumber}</span>
                            {selectedOrder >= 0 && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-950 text-xs font-bold text-white">{selectedOrder + 1}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {tool === 'editor' && files.length === 1 && <PdfVisualEditor key={`${files[0].name}-${files[0].size}-${files[0].lastModified}`} file={files[0]} />}
              {tool === 'forms' && files.length === 1 && <PdfFormEditor key={`${files[0].name}-${files[0].size}-${files[0].lastModified}`} file={files[0]} />}

              {tool === 'rotate' && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-gray-800">Angle de rotation</p>
                  <div className="flex gap-2">
                    {([90, 180, 270] as const).map(angle => (
                      <button key={angle} type="button" onClick={() => setRotation(angle)} className={`rounded-xl border px-5 py-2.5 text-sm font-medium ${rotation === angle ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>{angle}°</button>
                    ))}
                  </div>
                </div>
              )}

              {tool === 'organize' && (
                <div className="mt-6">
                  <label htmlFor="page-selection" className="mb-2 block text-sm font-semibold text-gray-800">Pages à conserver et ordre</label>
                  <input id="page-selection" type="text" value={pageSelection} onChange={event => setPageSelection(event.target.value)} placeholder={pageCount ? `Ex. 1,3,5-${Math.min(8, pageCount)}` : 'Ex. 1,3,5-8'} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-gray-500">Cliquez sur les aperçus ou saisissez les pages. Exemple : <strong>3,1,2</strong>.</p><button type="button" onClick={() => setPageSelection('')} className="shrink-0 text-xs font-medium text-red-600">Effacer l’ordre</button></div>
                </div>
              )}

              {tool === 'render' && <p className="mt-5 text-xs text-gray-500">Chaque page sera rendue en PNG haute résolution. Les gros PDF peuvent utiliser beaucoup de mémoire sur mobile.</p>}

              {error && <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              {!hasOwnPreview(tool) && (
                <button type="button" disabled={!canRun || processing} onClick={runTool} className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
                  {processing ? <><Loader2 size={18} className="animate-spin" /> Traitement en cours</> : selectedTool.action}
                </button>
              )}
            </div>

            {outputs.length > 0 && (
              <div className="border-t border-gray-100 bg-emerald-50/40 p-6 md:p-8">
                <p className="mb-3 text-sm font-semibold text-gray-900">Résultat{outputs.length > 1 ? 's' : ''} prêt{outputs.length > 1 ? 's' : ''}</p>
                <div className="max-h-80 space-y-2 overflow-auto">
                  {outputs.map(output => (
                    <a key={output.url} href={output.url} download={output.name} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 transition-all hover:shadow-sm">
                      <span className="truncate text-sm text-gray-700">{output.name}</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-950"><Download size={15} /> Télécharger</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default PdfTools;
