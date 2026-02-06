import React from 'react';
import { ConversionJob } from '../types/converter';
import { Check, X, Loader, Download } from 'lucide-react';

interface ConversionProgressProps {
  job: ConversionJob;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ job }) => {
  const getStatusIcon = () => {
    const baseClass = "flex-shrink-0";
    switch (job.status) {
      case 'completed':
        return <Check size={16} className={`${baseClass} text-green-600`} />;
      case 'error':
        return <X size={16} className={`${baseClass} text-red-500`} />;
      default:
        return <Loader size={16} className={`${baseClass} text-gray-400 animate-spin`} />;
    }
  };

  const getFileName = () => {
    const baseName = job.inputFile.name.split('.')[0];
    return baseName.length > 20 ? baseName.substring(0, 20) + '...' : baseName;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg border border-gray-200">
        {getStatusIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {getFileName()}.{job.outputFormat}
        </p>
        {job.status === 'processing' && (
          <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        )}
        {job.error && (
          <p className="text-xs text-red-500 mt-1">{job.error}</p>
        )}
      </div>

      {job.status === 'completed' && job.outputUrl && (
        <a
          href={job.outputUrl}
          download={`${job.inputFile.name.split('.')[0]}.${job.outputFormat}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Telecharger</span>
        </a>
      )}

      {job.status === 'processing' && (
        <span className="text-xs text-gray-400 tabular-nums">
          {job.progress}%
        </span>
      )}
    </div>
  );
};

export default ConversionProgress;