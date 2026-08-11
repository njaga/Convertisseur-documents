import { useCallback, useState } from 'react';
import { Accept, FileRejection, useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  title: string;
  hint: string;
  maxSize?: number;
}

const DEFAULT_MAX_SIZE = 150 * 1024 * 1024;

export default function FileDropZone({
  onFiles,
  accept,
  multiple = false,
  title,
  hint,
  maxSize = DEFAULT_MAX_SIZE,
}: FileDropZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const tooLarge = rejectedFiles.some(rejection => rejection.errors.some(item => item.code === 'file-too-large'));
      setError(tooLarge ? `Un fichier dépasse la limite de ${Math.round(maxSize / 1024 / 1024)} MB.` : 'Un ou plusieurs fichiers ne correspondent pas au format attendu.');
      return;
    }

    setError(null);
    if (acceptedFiles.length) onFiles(acceptedFiles);
  }, [maxSize, onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple, maxSize });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`group cursor-pointer rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all md:px-10 md:py-14 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDragActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
          <UploadCloud size={27} strokeWidth={1.8} />
        </div>
        <p className="text-lg font-semibold text-gray-950 md:text-xl">{isDragActive ? 'Déposez les fichiers ici' : title}</p>
        <p className="mt-2 text-sm text-gray-500">{isDragActive ? 'Relâchez pour les ajouter' : hint}</p>
        {!isDragActive && (
          <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-gray-800">
            Parcourir les fichiers
          </span>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
