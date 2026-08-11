import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import SupportedFormats from './pages/SupportedFormats';
import { useEffect, useRef, useState } from 'react';
import { FileType, ConversionJob, ConversionFormat } from './types/converter';
import FileUploader from './components/FileUploader';
import FormatSelector from './components/FormatSelector';
import ConversionProgress from './components/ConversionProgress';
import { Image, Video, Music, FileText, ArrowRight, Sparkles, Shield, Zap, Upload, X, Download } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MenuVisibilityHandler from './components/MenuVisibilityHandler';
import ScrollToTop from './components/ScrollToTop';
import { convertFile } from './services/conversionService';
import { getFileTypeFromExtension } from './utils/formats';
import TermsOfUsePage from './pages/TermsOfUsePage';
import PdfTools from './pages/PdfTools';
import OptimizeTools from './pages/OptimizeTools';
import DocumentLab from './pages/DocumentLab';
import BatchManager from './pages/BatchManager';
import NotFound from './pages/NotFound';
import FilePreview from './components/FilePreview';
import { createZip } from './services/zip';
import { saveHistory } from './services/history';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';

function App() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [batchDownload, setBatchDownload] = useState<{ url: string; name: string } | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);
  const [sourceFormat, setSourceFormat] = useState<string>('');
  const outputUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const outputUrls = outputUrlsRef.current;
    return () => {
      outputUrls.forEach(url => URL.revokeObjectURL(url));
      outputUrls.clear();
    };
  }, []);

  const handleFilesSelect = (files: File[]) => {
    const extensions = files.map(file => file.name.split('.').pop()?.toLowerCase() || '');
    const types = extensions.map(getFileTypeFromExtension);
    if (!types[0] || types.some(type => type !== types[0]) || extensions.some(extension => extension !== extensions[0])) {
      setSelectionError('Pour une conversion groupée, sélectionnez des fichiers du même format.');
      return;
    }
    setSelectionError(null);
    setSelectedFiles(prev => [...prev, ...files].filter((file, index, all) =>
      all.findIndex(candidate => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index
    ));
    setSourceFormat(extensions[0]);
    setFileType(types[0]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const next = prev.filter((_, fileIndex) => fileIndex !== index);
      if (!next.length) {
        setFileType(null);
        setSourceFormat('');
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setFileType(null);
    setSourceFormat('');
    setSelectionError(null);
  };

  const handlePdfSelect = (file: File) => {
    navigate('/modifier-pdf', { state: { initialFile: file } });
  };

  const handleFormatSelect = async (format: ConversionFormat) => {
    if (!selectedFiles.length) return;
    const filesToConvert = [...selectedFiles];
    if (batchDownload) {
      URL.revokeObjectURL(batchDownload.url);
      outputUrlsRef.current.delete(batchDownload.url);
      setBatchDownload(null);
    }

    const jobs = filesToConvert.map((inputFile, index): ConversionJob => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      inputFile,
      outputFormat: format.extension,
      status: 'pending',
      progress: 0,
    }));
    setConversionJobs(prev => [...prev, ...jobs]);
    clearSelection();

    const completed: Array<{ name: string; url: string }> = [];
    for (const job of jobs) {
      try {
        const outputUrl = await convertFile(job.inputFile, format.extension, progress => {
          setConversionJobs(prev => prev.map(item => item.id === job.id ? { ...item, progress, status: 'processing' } : item));
        });
        outputUrlsRef.current.add(outputUrl);
        const base = job.inputFile.name.replace(/\.[^.]+$/, '');
        completed.push({ name: `${base}.${format.extension}`, url: outputUrl });
        const historyBlob = await fetch(outputUrl).then(response => response.blob());
        await saveHistory(`${base}.${format.extension}`, `${job.inputFile.name} → ${format.extension}`, historyBlob).catch(() => undefined);
        setConversionJobs(prev => prev.map(item => item.id === job.id ? { ...item, status: 'completed', progress: 100, outputUrl } : item));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
        setConversionJobs(prev => prev.map(item => item.id === job.id ? { ...item, status: 'error', error: message } : item));
      }
    }

    if (completed.length > 1) {
      const entries = await Promise.all(completed.map(async output => ({ name: output.name, blob: await fetch(output.url).then(response => response.blob()) })));
      const zip = await createZip(entries);
      const zipUrl = URL.createObjectURL(zip);
      outputUrlsRef.current.add(zipUrl);
      setBatchDownload({ url: zipUrl, name: `conversions-${format.extension}.zip` });
    }
  };

  const getFileTypeIcon = (type: FileType) => {
    const iconProps = { size: 20, strokeWidth: 1.5, className: 'text-gray-600' };
    switch (type) {
      case 'image': return <Image {...iconProps} />;
      case 'video': return <Video {...iconProps} />;
      case 'audio': return <Music {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const features = [
    { icon: Zap, label: 'Rapide', desc: 'Conversion directement dans le navigateur' },
    { icon: Shield, label: 'Privé', desc: 'Vos fichiers restent sur votre appareil' },
    { icon: Sparkles, label: 'Gratuit', desc: 'Sans inscription' },
  ];

  const supportedTypes = [
    { icon: Image, label: 'Images', formats: 'PNG, JPG, WebP, ICO' },
    { icon: Video, label: 'Vidéos', formats: 'MP4, WebM, AVI, MKV, MOV, GIF' },
    { icon: Music, label: 'Audio', formats: 'MP3, WAV, OGG, AAC, FLAC, M4A' },
    { icon: FileText, label: 'Texte & PDF', formats: 'TXT, Markdown, HTML + outils PDF' },
  ];

  return (
    <>
      <MenuVisibilityHandler />
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/convertir" element={
            <main className="flex-grow">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
                <div className="relative pt-32 pb-20 px-6">
                  <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-600 mb-6 shadow-sm">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Open Source & 100% Gratuit</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4">
                      Convertissez vos fichiers
                      <span className="block mt-2 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                        en quelques clics
                      </span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
                      Convertissez vos images, vidéos, fichiers audio et documents directement dans votre navigateur.
                      Aucune inscription et aucun envoi de fichier vers nos serveurs.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                      {features.map(feature => (
                        <div key={feature.label} title={feature.desc} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                          <feature.icon size={16} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                    <Link to="/fusionner-pdf" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                      Outils PDF : convertir, fusionner, séparer, tourner et organiser <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative px-6 pb-20 -mt-4">
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl blur opacity-75" />
                    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <Upload size={16} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Déposez votre fichier</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <FileUploader onFilesSelect={handleFilesSelect} onPdfSelect={handlePdfSelect} />
                      </div>

                      {selectionError && <p role="alert" className="mx-6 mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{selectionError}</p>}

                      {selectedFiles.length > 0 && fileType && (
                        <div className="px-6 pb-6">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">{selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} prêt{selectedFiles.length > 1 ? 's' : ''}</p>
                            <button type="button" onClick={clearSelection} className="text-xs font-medium text-red-600 hover:text-red-700">Tout annuler</button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedFiles.map((file, index) => (
                              <article key={`${file.name}-${file.size}-${file.lastModified}`} className="relative rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <button type="button" onClick={() => removeSelectedFile(index)} aria-label={`Retirer ${file.name}`} className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 text-gray-600 shadow hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                                <FilePreview file={file} />
                                <div className="mt-3 flex items-center gap-2">
                                  <div className="rounded-lg border border-gray-200 bg-white p-2">{getFileTypeIcon(fileType)}</div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}

                      {fileType && (
                        <div className="px-6 pb-6">
                          <div className="flex items-center gap-2 mb-4">
                            <ArrowRight size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Choisissez le format de sortie</span>
                          </div>
                          <FormatSelector fileType={fileType} onFormatSelect={handleFormatSelect} sourceFormat={sourceFormat} />
                        </div>
                      )}
                    </div>
                  </div>

                  {batchDownload && (
                    <a href={batchDownload.url} download={batchDownload.name} className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-4 font-medium text-white hover:bg-gray-800">
                      <Download size={18} /> Télécharger toutes les conversions en ZIP
                    </a>
                  )}

                  {conversionJobs.length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <span className="text-sm font-medium text-gray-700">Conversions</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {conversionJobs.map(job => <ConversionProgress key={job.id} job={job} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-20">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Formats supportés</h2>
                    <p className="text-sm text-gray-500">Uniquement les conversions réellement prises en charge sont proposées.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {supportedTypes.map(type => (
                      <div key={type.label} className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-default">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gray-900 transition-colors">
                          <type.icon size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm">{type.label}</h3>
                        <p className="text-xs text-gray-400 mt-1">{type.formats}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          } />

          <Route path="/fusionner-pdf" element={<PdfTools />} />
          <Route path="/diviser-pdf" element={<PdfTools />} />
          <Route path="/modifier-pdf" element={<PdfTools />} />
          <Route path="/organiser-pdf" element={<PdfTools />} />
          <Route path="/pivoter-pdf" element={<PdfTools />} />
          <Route path="/pdf-en-png" element={<PdfTools />} />
          <Route path="/images-en-pdf" element={<PdfTools />} />
          <Route path="/pdf" element={<PdfTools />} />

          <Route path="/compresser-pdf" element={<OptimizeTools />} />
          <Route path="/optimiser-images" element={<OptimizeTools />} />
          <Route path="/compresser-video" element={<OptimizeTools />} />
          <Route path="/optimiser" element={<OptimizeTools />} />

          <Route path="/signer-pdf" element={<DocumentLab />} />
          <Route path="/ocr-pdf" element={<DocumentLab />} />
          <Route path="/creer-pdf" element={<DocumentLab />} />
          <Route path="/documents" element={<DocumentLab />} />
          <Route path="/batch" element={<BatchManager />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/formats" element={<SupportedFormats />} />
          <Route path="/conditions" element={<TermsOfUsePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}

export default App;