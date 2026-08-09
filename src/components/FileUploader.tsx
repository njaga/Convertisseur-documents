import React, { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { getAllAcceptedExtensions } from '../utils/formats';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  onPdfSelect?: (file: File) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const acceptedExtensions = new Set([...getAllAcceptedExtensions(), 'pdf']);

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, onPdfSelect }) => {
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

  return (
    <>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Upload size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-medium text-gray-900">{isDragActive ? 'Déposez les fichiers' : 'Déposez un ou plusieurs fichiers ici'}</p>
            <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir · 100 MB max. par fichier</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Images', 'PDF', 'Vidéos', 'Audio', 'Texte'].map(type => <span key={type} className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{type}</span>)}
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
};

export default FileUploader;
