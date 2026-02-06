import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragActive
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className={`
          p-4 rounded-full transition-colors
          ${isDragActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}
        `}>
          <Upload size={24} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-medium text-gray-900">
            {isDragActive ? 'Deposez le fichier' : 'Deposez un fichier ici'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ou cliquez pour parcourir
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {['Images', 'Videos', 'Audio', 'Documents'].map(type => (
            <span
              key={type}
              className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;