import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Download, FileText, Image, Music, Shield, Upload, Video, X, Zap } from 'lucide-react';
import ConversionProgress from '../components/ConversionProgress';
import FilePreview from '../components/FilePreview';
import FileUploader from '../components/FileUploader';
import FormatSelector from '../components/FormatSelector';
import { convertFile } from '../services/conversionService';
import { saveHistory } from '../services/history';
import { createZip } from '../services/zip';
import { ConversionFormat, ConversionJob, FileType } from '../types/converter';
import { getFileTypeFromExtension } from '../utils/formats';

const features = [
  { icon: Zap, label: 'Rapide', description: 'Traitement directement dans le navigateur lorsque le format le permet.' },
  { icon: Shield, label: 'Privé', description: 'Les conversions locales ne nécessitent pas d’envoyer vos fichiers.' },
];

const supportedTypes = [
  { icon: Image, label: 'Images', formats: 'PNG, JPG, WebP, ICO' },
  { icon: Video, label: 'Vidéos', formats: 'MP4, WebM, AVI, MKV, MOV, GIF' },
  { icon: Music, label: 'Audio', formats: 'MP3, WAV, OGG, AAC, FLAC, M4A' },
  { icon: FileText, label: 'Texte & documents', formats: 'TXT, Markdown, HTML et Office → PDF si configuré' },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function FileTypeIcon({ type }: { type: FileType }) {
  const props = { size: 20, strokeWidth: 1.5, className: 'text-gray-600' };
  if (type === 'image') return <Image {...props} />;
  if (type === 'video') return <Video {...props} />;
  if (type === 'audio') return <Music {...props} />;
  return <FileText {...props} />;
}

export default function ConverterPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [batchDownload, setBatchDownload] = useState<{ url: string; name: string } | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);
  const [sourceFormat, setSourceFormat] = useState('');
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
    setSelectedFiles(previous => [...previous, ...files].filter((file, index, all) =>
      all.findIndex(candidate => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index
    ));
    setSourceFormat(extensions[0]);
    setFileType(types[0]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(previous => {
      const next = previous.filter((_, fileIndex) => fileIndex !== index);
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

    setConversionJobs(previous => [...previous, ...jobs]);
    clearSelection();

    const completed: Array<{ name: string; url: string }> = [];
    for (const job of jobs) {
      try {
        const outputUrl = await convertFile(job.inputFile, format.extension, progress => {
          setConversionJobs(previous => previous.map(item =>
            item.id === job.id ? { ...item, progress, status: 'processing' } : item
          ));
        });
        outputUrlsRef.current.add(outputUrl);

        const baseName = job.inputFile.name.replace(/\.[^.]+$/, '');
        const outputName = `${baseName}.${format.extension}`;
        completed.push({ name: outputName, url: outputUrl });

        const historyBlob = await fetch(outputUrl).then(response => response.blob());
        await saveHistory(outputName, `${job.inputFile.name} → ${format.extension}`, historyBlob).catch(() => undefined);

        setConversionJobs(previous => previous.map(item =>
          item.id === job.id ? { ...item, status: 'completed', progress: 100, outputUrl } : item
        ));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
        setConversionJobs(previous => previous.map(item =>
          item.id === job.id ? { ...item, status: 'error', error: message } : item
        ));
      }
    }

    if (completed.length > 1) {
      const entries = await Promise.all(completed.map(async output => ({
        name: output.name,
        blob: await fetch(output.url).then(response => response.blob()),
      })));
      const zip = await createZip(entries);
      const zipUrl = URL.createObjectURL(zip);
      outputUrlsRef.current.add(zipUrl);
      setBatchDownload({ url: zipUrl, name: `conversions-${format.extension}.zip` });
    }
  };

  return (
    <main className="flex-grow bg-gray-50">
      <section className="border-b border-gray-200 bg-white px-6 pb-12 pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600">
            <Shield size={14} className="text-[#2457E6]" />
            Traitement local en priorité
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">Convertir un fichier</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            Convertissez images, vidéos, fichiers audio et documents avec uniquement les formats de sortie réellement disponibles.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {features.map(feature => (
              <div key={feature.label} title={feature.description} className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-700">
                <feature.icon size={15} className="text-[#2457E6]" />
                {feature.label}
              </div>
            ))}
          </div>
          <Link to="/formats" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#2457E6] hover:underline">
            Voir tous les formats pris en charge <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 text-sm font-medium text-gray-700">
              <Upload size={16} className="text-[#2457E6]" />
              Déposez vos fichiers
            </div>
            <div className="p-6">
              <FileUploader onFilesSelect={handleFilesSelect} onPdfSelect={handlePdfSelect} />
            </div>

            {selectionError && (
              <p role="alert" className="mx-6 mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {selectionError}
              </p>
            )}

            {selectedFiles.length > 0 && fileType && (
              <div className="px-6 pb-6">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} prêt{selectedFiles.length > 1 ? 's' : ''}
                  </p>
                  <button type="button" onClick={clearSelection} className="text-xs font-medium text-red-600 hover:text-red-700">
                    Tout retirer
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedFiles.map((file, index) => (
                    <article key={`${file.name}-${file.size}-${file.lastModified}`} className="relative rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        aria-label={`Retirer ${file.name}`}
                        className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={15} />
                      </button>
                      <FilePreview file={file} />
                      <div className="mt-3 flex items-center gap-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-2"><FileTypeIcon type={fileType} /></div>
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
              <div className="border-t border-gray-100 px-6 py-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ArrowRight size={16} className="text-gray-400" />
                  Choisissez le format de sortie
                </div>
                <FormatSelector fileType={fileType} onFormatSelect={handleFormatSelect} sourceFormat={sourceFormat} />
              </div>
            )}
          </div>

          {batchDownload && (
            <a href={batchDownload.url} download={batchDownload.name} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#2457E6] px-5 py-4 font-medium text-white hover:bg-[#1e49c4]">
              <Download size={18} />
              Télécharger toutes les conversions en ZIP
            </a>
          )}

          {conversionJobs.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-4 text-sm font-medium text-gray-700">Conversions</div>
              <div className="space-y-3 p-4">
                {conversionJobs.map(job => <ConversionProgress key={job.id} job={job} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Familles de formats</h2>
              <p className="mt-1 text-sm text-gray-500">La disponibilité exacte dépend du format source et, pour Office, de la configuration serveur.</p>
            </div>
            <Link to="/batch" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2457E6] hover:underline">
              Traitement par lot <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {supportedTypes.map(type => (
              <article key={type.label} className="rounded-xl border border-gray-200 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2457E6]">
                  <type.icon size={18} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{type.label}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{type.formats}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
