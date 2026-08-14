import React, { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import FileDropZone from './FileDropZone';
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

  const validateAndForward = useCallback((files: File[]) => {
    setError(null);

    const valid = files.filter(file => acceptedExtensions.has(file.name.split('.').pop()?.toLowerCase() || ''));
    if (valid.length !== files.length) {
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

  const onCompactDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      setError('Un ou plusieurs fichiers dépassent 100 MB ou ne peuvent pas être lus.');
      return;
    }
    validateAndForward(acceptedFiles);
  }, [validateAndForward]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onCompactDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  if (!compact) {
    return (
      <div>
        <FileDropZone
          onFiles={validateAndForward}
          multiple
          maxSize={MAX_FILE_SIZE}
          title="Sélectionner les fichiers à convertir"
          hint="ou glissez-déposez vos fichiers ici · 100 MB max. par fichier"
        />
        {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </div>
    );
  }

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
};

export default FileUploader;
