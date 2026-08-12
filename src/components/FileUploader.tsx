import React, { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { getAllAcceptedExtensions } from '../utils/formats';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  onPdfSelect?: (file: File) => void;
  compact?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const acceptedExtensions = new Set([...getAllAcceptedExtensions(), 'pdf']);

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, onPdfSelect, compact = false }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Un ou plusieurs fichiers dépassent 100 MB ou ne peuvent pas être lus.');
      return;
    }

    const valid = acceptedFiles.filter(file => acceptedExtensions.has(file.name.split('.').pop()?.toLowerCase() || ''));
    if (valid.length !== acceptedFiles.length) {
      setError('Un ou plusieurs formats ne sont pas encore pris en charge.');
      return;
    }

    if (valid.length === 1 && valid[0].name.toLowerCase().endsWith('.pdf')) {
      if (onPdfSelect) onPdfSelect(valid[0]);
      else setError('Utilisez l’espace Outils PDF pour ce fichier.');
      return;
    }

    if (valid.some(file => file.name.toLowerCase().endsWith('.pdf'))) {
      setError('Les PDF se traitent dans l’espace Outils PDF. Ne les mélangez pas avec les autres formats.');
      return;
    }

    if (valid.length) onFilesSelect(valid);
  }, [onFilesSelect, onPdfSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  if (compact) {
    return (
      <>
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border border-dashed px-4 py-3 transition-colors ${
            isDragActive ? 'border-[#2457E6] bg-blue-50/60' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
            <UploadCloud size={17} className="text-[#2457E6]" />
            {isDragActive ? 'Déposez les fichiers ici' : 'Ajouter d’autres fichiers'}
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </>
    );
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors md:py-16 ${
          isDragActive ? 'border-[#2457E6] bg-blue-50/50' : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDragActive ? 'bg-[#2457E6] text-white' : 'bg-blue-50 text-[#2457E6]'}`}>
            <UploadCloud size={28} strokeWidth={1.7} />
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-950">
            {isDragActive ? 'Déposez les fichiers ici' : 'Sélectionner les fichiers à convertir'}
          </p>
          <p className="mt-2 text-sm text-gray-500">ou glissez-déposez vos fichiers ici · 100 MB max. par fichier</p>
          <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white">
            Parcourir les fichiers
          </span>
          <p className="mt-4 text-xs text-gray-400">Images, vidéo, audio, texte et documents compatibles</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    </>
  );
};

export default FileUploader;
