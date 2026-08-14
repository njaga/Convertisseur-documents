import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Download, FileText, Image, Music, Video, X } from 'lucide-react';
import ConversionProgress from '../components/ConversionProgress';
import FilePreview from '../components/FilePreview';
import FileUploader from '../components/FileUploader';
import FormatSelector from '../components/FormatSelector';
import { convertFile } from '../services/conversionService';
import { saveHistory } from '../services/history';
import { createZip } from '../services/zip';
import { ConversionFormat, ConversionJob, FileType } from '../types/converter';
import { getFileTypeFromExtension } from '../utils/formats';

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
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">Convertir un fichier</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            Convertissez images, vidéos, fichiers audio et documents vers les formats réellement disponibles pour votre fichier.
          </p>
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          {selectedFiles.length === 0 && (
            <FileUploader onFilesSelect={handleFilesSelect} onPdfSelect={handlePdfSelect} />
          )}

          {selectionError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {selectionError}
            </p>
          )}

          {selectedFiles.length > 0 && fileType && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-950">
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} prêt{selectedFiles.length > 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Tous les fichiers d’un lot doivent avoir le même format source.</p>
                </div>
                <button type="button" onClick={clearSelection} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Changer de fichiers
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selectedFiles.map((file, index) => (
                  <article key={`${file.name}-${file.size}-${file.lastModified}`} className="relative rounded-2xl border border-gray-200 bg-gray-50 p-3">
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
                        <p className="truncate pr-6 text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4">
                <FileUploader compact onFilesSelect={handleFilesSelect} onPdfSelect={handlePdfSelect} />
              </div>

              <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5" aria-labelledby="output-format-title">
                <div className="mb-4">
                  <h2 id="output-format-title" className="text-sm font-semibold text-gray-900">Choisissez le format de sortie</h2>
                  <p className="mt-1 text-xs text-gray-500">Seules les conversions réellement compatibles avec le format source sont proposées.</p>
                </div>
                <FormatSelector fileType={fileType} onFormatSelect={handleFormatSelect} sourceFormat={sourceFormat} />
              </section>
            </>
          )}
        </section>

        {batchDownload && (
          <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm md:p-7">
            <a href={batchDownload.url} download={batchDownload.name} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
              <Download size={17} /> Télécharger toutes les conversions en ZIP
            </a>
          </section>
        )}

        {conversionJobs.length > 0 && (
          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-950">Conversions</h2>
              <p className="mt-1 text-xs text-gray-500">Suivez chaque fichier jusqu’à ce que le résultat soit prêt.</p>
            </div>
            <div className="space-y-3">
              {conversionJobs.map(job => <ConversionProgress key={job.id} job={job} />)}
            </div>
          </section>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/formats" className="inline-flex items-center gap-1.5 font-medium text-[#2457E6] hover:underline">
            Formats pris en charge <ArrowRight size={14} />
          </Link>
          <Link to="/batch" className="inline-flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-950">
            Traitement par lot <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
