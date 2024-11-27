import { Routes, Route } from 'react-router-dom';
import SupportedFormats from './pages/SupportedFormats';
import { useState } from 'react';
import { FileType, ConversionJob, ConversionFormat } from './types/converter';
import FileUploader from './components/FileUploader';
import FormatSelector from './components/FormatSelector';
import ConversionProgress from './components/ConversionProgress';
import { FileCheck, File, Image, Video, Music } from 'lucide-react';
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
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'ico', 'heic'].includes(extension)) {
        setFileType('image');
      } else if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', '3gp', 'm4v', 'mpeg'].includes(extension)) {
        setFileType('video');
      } else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'aiff', 'amr', 'opus'].includes(extension)) {
        setFileType('audio');
      } else {
        setFileType('document');
      }
    }
  };

  const handleFormatSelect = async (format: ConversionFormat) => {
    if (selectedFile) {
      console.log('Début de la conversion:', {
        fileName: selectedFile.name,
        outputFormat: format.extension,
        fileSize: selectedFile.size
      });

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
        console.log('Conversion en cours...');
        newJob.status = 'processing';
        const outputUrl = await convertFile(
          selectedFile,
          format.extension,
          (progress) => {
            console.log(`Progression: ${progress}%`);
            setConversionJobs(prev =>
              prev.map(job =>
                job.id === newJob.id ? { ...job, progress } : job
              )
            );
          }
        );

        console.log('Conversion terminée avec succès');
        setConversionJobs(prev =>
          prev.map(job =>
            job.id === newJob.id
              ? { ...job, status: 'completed', progress: 100, outputUrl }
              : job
          )
        );
      } catch (error) {
        console.error('Erreur de conversion:', error);
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

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />;
      case 'video':
        return <Video className="w-8 h-8 text-blue-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-blue-500" />;
    }
  };

  return (
    <>
      <MenuVisibilityHandler />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <main className="flex-grow">
              <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12 pt-16 md:pt-20">
                    <FileCheck className="w-16 h-16 mx-auto text-blue-500 mb-6" />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      Convertisseur de Fichiers
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Convertissez facilement vos fichiers dans différents formats
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <FileUploader onFileSelect={handleFileSelect} />
                  </div>

                  {selectedFile && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                      <div className="flex items-center space-x-4 mb-4">
                        {fileType && getFileTypeIcon(fileType)}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedFile.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {fileType}
                          </p>
                        </div>
                        {fileType === 'image' && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Aperçu"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-full animate-pulse"></div>
                      </div>
                    </div>
                  )}

                  {fileType && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                      <div className="flex flex-col items-center space-y-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Sélectionnez le format de sortie
                        </h2>
                        <div className="h-1 w-24 bg-blue-500 rounded-full"></div>
                        <p className="text-gray-600 text-center">
                          Choisissez le format dans lequel vous souhaitez convertir votre fichier
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <FormatSelector
                          fileType={fileType}
                          onFormatSelect={handleFormatSelect}
                          sourceFormat={sourceFormat}
                        />
                      </div>
                    </div>
                  )}

                  {conversionJobs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                      <div className="flex flex-col items-center space-y-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Conversions en cours
                        </h2>
                        <div className="h-1 w-24 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="space-y-4">
                        {conversionJobs.map(job => (
                          <ConversionProgress key={job.id} job={job} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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