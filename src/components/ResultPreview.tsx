import { FileText } from 'lucide-react';

interface ResultPreviewProps {
  url: string;
  name: string;
  className?: string;
}

export default function ResultPreview({ url, name, className = '' }: ResultPreviewProps) {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  const frame = `w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${className}`;

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'].includes(extension)) {
    return <img src={url} alt={`Aperçu de ${name}`} className={`${frame} h-48 object-contain`} />;
  }

  if (['mp4', 'webm', 'mov'].includes(extension)) {
    return <video src={url} controls preload="metadata" className={`${frame} h-48 bg-black object-contain`} />;
  }

  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
    return <div className={`${frame} p-4`}><audio src={url} controls preload="metadata" className="w-full" /></div>;
  }

  if (extension === 'pdf') {
    return <iframe src={`${url}#toolbar=0&navpanes=0&view=FitH`} title={`Aperçu de ${name}`} className={`${frame} h-72 bg-white`} />;
  }

  if (['txt', 'md', 'html'].includes(extension)) {
    return <iframe src={url} sandbox="" title={`Aperçu de ${name}`} className={`${frame} h-48 bg-white`} />;
  }

  return (
    <div className={`${frame} flex h-28 flex-col items-center justify-center p-4 text-center`}>
      <FileText size={22} className="mb-2 text-gray-400" />
      <p className="text-xs text-gray-500">Aperçu du résultat indisponible pour ce format.</p>
    </div>
  );
}
