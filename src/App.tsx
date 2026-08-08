import { Routes, Route } from 'react-router-dom';
import SupportedFormats from './pages/SupportedFormats';
import { useEffect, useRef, useState } from 'react';
import { FileType, ConversionJob, ConversionFormat } from './types/converter';
import FileUploader from './components/FileUploader';
import FormatSelector from './components/FormatSelector';
import ConversionProgress from './components/ConversionProgress';
import { Image, Video, Music, FileText, ArrowRight, Sparkles, Shield, Zap, Upload } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MenuVisibilityHandler from './components/MenuVisibilityHandler';
import { convertFile } from './services/conversionService';
import { getFileTypeFromExtension } from './utils/formats';
import TermsOfUsePage from './pages/TermsOfUsePage';
import NotFound from './pages/NotFound';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);
  const [sourceFormat, setSourceFormat] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const outputUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedFile || fileType !== 'image') {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile, fileType]);

  useEffect(() => {
    return () => {
      outputUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      outputUrlsRef.current.clear();
    };
  }, []);

  const handleFileSelect = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedType = getFileTypeFromExtension(extension);
    if (!detectedType) return;

    setSelectedFile(file);
    setSourceFormat(extension);
    setFileType(detectedType);
  };

  const handleFormatSelect = async (format: ConversionFormat) => {
    if (!selectedFile) return;

    const inputFile = selectedFile;
    const newJob: ConversionJob = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      inputFile,
      outputFormat: format.extension,
      status: 'pending',
      progress: 0,
    };

    setConversionJobs(prev => [...prev, newJob]);
    setSelectedFile(null);
    setFileType(null);
    setSourceFormat('');

    try {
      const outputUrl = await convertFile(inputFile, format.extension, progress => {
        setConversionJobs(prev =>
          prev.map(job =>
            job.id === newJob.id ? { ...job, progress, status: 'processing' } : job
          )
        );
      });

      outputUrlsRef.current.add(outputUrl);
      setConversionJobs(prev =>
        prev.map(job =>
          job.id === newJob.id
            ? { ...job, status: 'completed', progress: 100, outputUrl }
            : job
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
      setConversionJobs(prev =>
        prev.map(job =>
          job.id === newJob.id
            ? { ...job, status: 'error', error: message }
            : job
        )
      );
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
    { icon: Shield, label: 'Prive', desc: 'Vos fichiers restent sur votre appareil' },
    { icon: Sparkles, label: 'Gratuit', desc: 'Sans inscription' },
  ];

  const supportedTypes = [
    { icon: Image, label: 'Images', formats: 'PNG, JPG, WebP' },
    { icon: Video, label: 'Videos', formats: 'MP4, WebM, AVI, MKV, MOV, GIF' },
    { icon: Music, label: 'Audio', formats: 'MP3, WAV, OGG, AAC, FLAC, M4A' },
    { icon: FileText, label: 'Texte', formats: 'TXT, Markdown, HTML' },
  ];

  return (
    <>
      <MenuVisibilityHandler />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={
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
                      Convertissez vos images, videos, fichiers audio et documents texte directement dans votre navigateur.
                      Aucune inscription et aucun envoi de fichier vers nos serveurs.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                      {features.map(feature => (
                        <div key={feature.label} title={feature.desc} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                          <feature.icon size={16} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                        </div>
                      ))}
                    </div>
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
                          <span className="text-sm font-medium text-gray-700">Deposez votre fichier</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <FileUploader onFileSelect={handleFileSelect} />
                      </div>

                      {selectedFile && fileType && (
                        <div className="px-6 pb-6">
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">{getFileTypeIcon(fileType)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)} • {fileType}</p>
                            </div>
                            {fileType === 'image' && previewUrl && (
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                <img src={previewUrl} alt="Apercu du fichier selectionne" className="w-full h-full object-cover" />
                              </div>
                            )}
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Formats supportes</h2>
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
