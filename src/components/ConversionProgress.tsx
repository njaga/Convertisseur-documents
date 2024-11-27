import React from 'react';
import { ConversionJob } from '../types/converter';
import { CheckCircle, XCircle, Loader, Download } from 'lucide-react';

interface ConversionProgressProps {
  job: ConversionJob;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ job }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">
            {job.inputFile.name} → .{job.outputFormat}
          </span>
        </div>
        {job.status === 'completed' && job.outputUrl && (
          <a
            href={job.outputUrl}
            download={`${job.inputFile.name.split('.')[0]}.${job.outputFormat}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </a>
        )}
      </div>
      
      <div className="relative pt-1">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${job.progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
          />
        </div>
      </div>
      
      {job.error && (
        <p className="text-sm text-red-500 mt-2">{job.error}</p>
      )}
    </div>
  );
};

export default ConversionProgress;