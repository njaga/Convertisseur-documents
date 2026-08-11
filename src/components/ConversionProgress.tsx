import React from 'react';
import { Check, Download, Eye, Loader, X } from 'lucide-react';
import { ConversionJob } from '../types/converter';
import ResultPreview from './ResultPreview';

interface ConversionProgressProps {
  job: ConversionJob;
}

function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ job }) => {
  const baseName = getBaseName(job.inputFile.name);
  const displayName = baseName.length > 28 ? `${baseName.slice(0, 28)}...` : baseName;
  const outputName = `${baseName}.${job.outputFormat}`;

  const getStatusIcon = () => {
    const baseClass = 'flex-shrink-0';
    switch (job.status) {
      case 'completed': return <Check size={16} className={`${baseClass} text-green-600`} />;
      case 'error': return <X size={16} className={`${baseClass} text-red-500`} />;
      default: return <Loader size={16} className={`${baseClass} animate-spin text-gray-400`} />;
    }
  };

  return (
    <article className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-2">{getStatusIcon()}</div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900" title={outputName}>{displayName}.{job.outputFormat}</p>
          {job.status === 'processing' && (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-gray-900 transition-all duration-300" style={{ width: `${job.progress}%` }} />
            </div>
          )}
          {job.error && <p className="mt-1 text-xs text-red-500">{job.error}</p>}
        </div>

        {job.status === 'completed' && job.outputUrl && (
          <a href={job.outputUrl} download={outputName} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <Download size={14} /> <span className="hidden sm:inline">Télécharger</span>
          </a>
        )}

        {(job.status === 'processing' || job.status === 'pending') && <span className="text-xs tabular-nums text-gray-400">{job.progress}%</span>}
      </div>

      {job.status === 'completed' && job.outputUrl && (
        <details className="mt-3 border-t border-gray-200 pt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-950"><Eye size={14} /> Voir l’aperçu du résultat</summary>
          <div className="mt-3"><ResultPreview url={job.outputUrl} name={outputName} /></div>
        </details>
      )}
    </article>
  );
};

export default ConversionProgress;
