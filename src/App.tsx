import { Routes, Route } from 'react-router-dom';
import SupportedFormats from './pages/SupportedFormats';
import { useState } from 'react';
import { FileType, ConversionJob, ConversionFormat } from './types/converter';
import FileUploader from './components/FileUploader';
import FormatSelector from './components/FormatSelector';
import ConversionProgress from './components/ConversionProgress';
import { Image, Video, Music, FileText, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MenuVisibilityHandler from './components/MenuVisibilityHandler';
import { convertFile } from './services/conversionService';
import TermsOfUsePage from './pages/TermsOfUsePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFound from './pages/NotFound';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);
  const [sourceFormat, setSourceFormat] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    setSourceFormat(extension);

    if (extension) {
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico'].includes(extension)) {
        setFileType('image');
      } else if (['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v'].includes(extension)) {
        setFileType('video');
      } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
        setFileType('audio');
      } else {
        setFileType('document');
      }
    }
  };

  const handleFormatSelect = async (format: ConversionFormat) => {
    if (selectedFile) {
      const newJob: ConversionJob = {
        id: Date.now().toString(),
        inputFile: selectedFile,
        outputFormat: format.extension,
        status: 'pending',
        progress: 0
      };

      setConversionJobs(prev => [...prev, newJob]);
      setSelectedFile(null);
      setFileType(null);

      try {
        const outputUrl = await convertFile(
          selectedFile,
          format.extension,
          (progress) => {
            setConversionJobs(prev =>
              prev.map(job =>
                job.id === newJob.id ? { ...job, progress, status: 'processing' } : job
              )
            );
          }
        );

        setConversionJobs(prev =>
          prev.map(job =>
            job.id === newJob.id
              ? { ...job, status: 'completed', progress: 100, outputUrl }
              : job
          )
        );
      } catch {
        setConversionJobs(prev =>
          prev.map(job =>
            job.id === newJob.id
              ? { ...job, status: 'error', error: 'Erreur lors de la conversion' }
              : job
          )
        );
      }
    }
  };

  const getFileTypeIcon = (type: FileType) => {
    const iconProps = { size: 20, strokeWidth: 1.5, className: "text-gray-600" };
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

  return (
    <>
      <MenuVisibilityHandler />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <main className="flex-grow pt-24 pb-16 px-6">
              <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                    Convertisseur de fichiers
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Convertissez vos fichiers rapidement et gratuitement
                  </p>
                </div>

                {/* Uploader */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>

                {/* Selected File Info */}
                {selectedFile && fileType && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-xl">
                        {getFileTypeIcon(fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)} - {fileType}
                        </p>
                      </div>
                      {fileType === 'image' && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Format Selector */}
                {fileType && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowRight size={16} className="text-gray-400" />
                      <h2 className="font-medium text-gray-900">Format de sortie</h2>
                    </div>
                    <FormatSelector
                      fileType={fileType}
                      onFormatSelect={handleFormatSelect}
                      sourceFormat={sourceFormat}
                    />
                  </div>
                )}

                {/* Conversion Progress */}
                {conversionJobs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="font-medium text-gray-900 mb-4">Conversions</h2>
                    <div className="space-y-3">
                      {conversionJobs.map(job => (
                        <ConversionProgress key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </main>
          } />
          <Route path="/formats" element={<SupportedFormats />} />
          <Route path="/conditions" element={<TermsOfUsePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}

export default App;