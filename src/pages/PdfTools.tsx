import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileImage, FilePlus2, Merge, RotateCw, Scissors, Download, Loader2, ShieldCheck, ListOrdered, Images, X, ArrowUp, ArrowDown } from 'lucide-react';
import { createPdfPagePreviews, getPdfPageCount, imagesToPdf, mergePdfs, organizePdf, pdfToPngs, PdfOutput, PdfPagePreview, rotatePdf, splitPdf } from '../services/pdfTools';

type Tool = 'images' | 'render' | 'merge' | 'split' | 'rotate' | 'organize';
type LocationState = { initialFile?: File } | null;

const tools: Array<{ id: Tool; label: string; description: string; icon: typeof FileImage }> = [
  { id: 'images', label: 'Images → PDF', description: 'PNG, JPG, WebP et ICO vers un PDF', icon: FileImage },
  { id: 'render', label: 'PDF → PNG', description: 'Convertir chaque page en image PNG', icon: Images },
  { id: 'merge', label: 'Fusionner', description: 'Regrouper plusieurs PDF en un seul', icon: Merge },
  { id: 'split', label: 'Séparer', description: 'Créer un PDF par page', icon: Scissors },
  { id: 'rotate', label: 'Rotation', description: 'Tourner toutes les pages', icon: RotateCw },
  { id: 'organize', label: 'Organiser', description: 'Extraire ou réordonner des pages', icon: ListOrdered },
];

const PdfTools = () => {
  const location = useLocation();
  const initialFile = (location.state as LocationState)?.initialFile;
  const [tool, setTool] = useState<Tool>(initialFile ? 'organize' : 'images');
  const [files, setFiles] = useState<File[]>(initialFile ? [initialFile] : []);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [pageSelection, setPageSelection] = useState('');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [outputs, setOutputs] = useState<PdfOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const urlsRef = useRef<Set<string>>(new Set());
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    setPreviews([]);
    if (!files.length || tool === 'images') return;

    let cancelled = false;
    setLoadingPreviews(true);
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
    if (files.length !== 1 || tool === 'images' || tool === 'merge') return;

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

  const changeTool = (next: Tool) => {
    resetResults();
    setFiles([]);
    setPageSelection('');
    setPageCount(null);
    setTool(next);
  };

  const handleFiles = (selected: FileList | null) => {
    resetResults();
    setPageCount(null);
    if (!selected) return;
    const nextFiles = Array.from(selected);
    const invalid = nextFiles.find(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (tool === 'images') return !['png', 'jpg', 'jpeg', 'webp', 'ico'].includes(extension ?? '');
      return extension !== 'pdf';
    });
    if (invalid) {
      setFiles([]);
      setError(`Le fichier ${invalid.name} n'est pas valide pour cet outil.`);
      return;
    }
    setFiles(nextFiles);
  };

  const removeFile = (index: number) => {
    resetResults();
    setFiles(current => current.filter((_, fileIndex) => fileIndex !== index));
    setPageCount(null);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
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
  const canRun = tool === 'images'
    ? files.length >= 1
    : tool === 'merge'
      ? files.length >= 2
      : tool === 'organize'
        ? files.length === 1 && pageSelection.trim().length > 0
        : files.length === 1;

  return (
    <main className="flex-grow pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 mb-5">
            <ShieldCheck size={15} />
            Traitement 100 % local
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Outils PDF</h1>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Créez, convertissez et modifiez vos PDF directement dans votre navigateur. Aucun document n'est envoyé vers un serveur.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          {tools.map(item => (
            <button key={item.id} type="button" onClick={() => changeTool(item.id)} className={`text-left rounded-2xl border p-5 transition-all ${tool === item.id ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
              <item.icon size={20} className={tool === item.id ? 'text-white' : 'text-gray-600'} />
              <p className="font-semibold mt-3">{item.label}</p>
              <p className={`text-xs mt-1 leading-relaxed ${tool === item.id ? 'text-gray-300' : 'text-gray-500'}`}>{item.description}</p>
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <label className="block border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl p-10 text-center cursor-pointer transition-colors">
              <input type="file" className="hidden" multiple={multiple} accept={acceptsImages ? '.png,.jpg,.jpeg,.webp,.ico,image/*' : '.pdf,application/pdf'} onChange={event => handleFiles(event.target.files)} />
              <FilePlus2 size={30} className="mx-auto text-gray-500 mb-3" />
              <p className="font-medium text-gray-900">Sélectionnez {multiple ? 'vos fichiers' : 'un fichier'}</p>
              <p className="text-sm text-gray-500 mt-1">{acceptsImages ? 'PNG, JPG, JPEG, WebP ou ICO' : 'PDF uniquement'}</p>
            </label>

            {files.length > 0 && (
              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</p>
                  <button type="button" onClick={() => setFiles([])} className="text-xs font-medium text-red-600 hover:text-red-700">Tout annuler</button>
                </div>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <span className="flex-1 truncate text-xs text-gray-600"><strong className="mr-2 text-gray-900">{index + 1}.</strong>{file.name}</span>
                      {multiple && <>
                        <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0} aria-label="Monter" className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ArrowUp size={15} /></button>
                        <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} aria-label="Descendre" className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ArrowDown size={15} /></button>
                      </>}
                      <button type="button" onClick={() => removeFile(index)} aria-label={`Retirer ${file.name}`} className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                    </div>
                  ))}
                </div>
                {pageCount !== null && <p className="text-xs text-gray-500 mt-2">{pageCount} page{pageCount > 1 ? 's' : ''}</p>}
              </div>
            )}

            {files.length > 0 && tool !== 'images' && (
              <section className="mt-5" aria-label="Aperçu des pages">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Aperçu des pages</p>
                  {tool === 'organize' && <p className="text-xs text-gray-500">Cliquez dans l’ordre souhaité</p>}
                </div>
                {loadingPreviews ? (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Génération des aperçus…</div>
                ) : (
                  <div className="grid max-h-[32rem] grid-cols-2 gap-3 overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {previews.map(preview => {
                      const selectedOrder = tool === 'organize' ? pageSelection.split(',').map(value => Number(value.trim())).lastIndexOf(preview.pageNumber) : -1;
                      return (
                        <button key={`${preview.fileIndex}-${preview.pageNumber}`} type="button" onClick={() => selectPreviewPage(preview.pageNumber)} disabled={tool !== 'organize'} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm disabled:cursor-default">
                          <img src={preview.url} alt={`Page ${preview.pageNumber} de ${files[preview.fileIndex]?.name}`} className="aspect-[3/4] w-full object-contain" />
                          <span className="block truncate border-t border-gray-100 px-2 py-1.5 text-[11px] text-gray-600">{tool === 'merge' ? `${preview.fileIndex + 1}. ` : ''}Page {preview.pageNumber}</span>
                          {selectedOrder >= 0 && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{selectedOrder + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tool === 'rotate' && (
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Angle de rotation</p>
                <div className="flex gap-2">
                  {([90, 180, 270] as const).map(angle => (
                    <button key={angle} type="button" onClick={() => setRotation(angle)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${rotation === angle ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}>{angle}°</button>
                  ))}
                </div>
              </div>
            )}

            {tool === 'organize' && (
              <div className="mt-5">
                <label htmlFor="page-selection" className="block text-sm font-medium text-gray-700 mb-2">Pages à conserver et ordre</label>
                <input id="page-selection" type="text" value={pageSelection} onChange={event => setPageSelection(event.target.value)} placeholder={pageCount ? `Ex. 1,3,5-${Math.min(8, pageCount)}` : 'Ex. 1,3,5-8'} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400" />
                <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-gray-500">Cliquez sur les aperçus ou saisissez les pages. Exemple : <strong>3,1,2</strong>.</p><button type="button" onClick={() => setPageSelection('')} className="shrink-0 text-xs font-medium text-red-600">Effacer l’ordre</button></div>
              </div>
            )}

            {tool === 'render' && <p className="mt-5 text-xs text-gray-500">Chaque page sera rendue en PNG haute résolution. Les gros PDF peuvent utiliser beaucoup de mémoire sur mobile.</p>}

            {error && <p role="alert" className="mt-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

            <button type="button" disabled={!canRun || processing} onClick={runTool} className="mt-6 w-full h-12 rounded-xl bg-gray-900 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              {processing ? <><Loader2 size={18} className="animate-spin" /> Traitement en cours</> : tools.find(item => item.id === tool)?.label}
            </button>
          </div>

          {outputs.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/70 p-6 md:p-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">Résultat{outputs.length > 1 ? 's' : ''}</p>
              <div className="space-y-2 max-h-80 overflow-auto">
                {outputs.map(output => (
                  <a key={output.url} href={output.url} download={output.name} className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all">
                    <span className="text-sm text-gray-700 truncate">{output.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900"><Download size={15} /> Télécharger</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PdfTools;
