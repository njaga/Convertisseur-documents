import React, { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { getAllAcceptedExtensions } from '../utils/formats';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const acceptedExtensions = new Set(getAllAcceptedExtensions());

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Le fichier dépasse 100 MB ou ne peut pas être lu.');
      return;
    }
    const file = acceptedFiles[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedExtensions.has(extension)) {
      setError(`Le format .${extension || '?'} n'est pas encore pris en charge.`);
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
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
            <p className="text-base font-medium text-gray-900">{isDragActive ? 'Deposez le fichier' : 'Deposez un fichier ici'}</p>
            <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir · 100 MB max.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Images', 'Videos', 'Audio', 'Texte'].map(type => <span key={type} className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{type}</span>)}
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
};

export default FileUploader;
