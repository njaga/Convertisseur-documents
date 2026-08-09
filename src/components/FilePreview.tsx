import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  className?: string;
}

export default function FilePreview({ file, className = '' }: FilePreviewProps) {
  const [text, setText] = useState('');
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'].includes(extension);
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPdf = file.type === 'application/pdf' || extension === 'pdf';
  const isText = file.type.startsWith('text/') || ['txt', 'md', 'html'].includes(extension);

  const url = useMemo(() => isText ? '' : URL.createObjectURL(file), [file, isText]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => {
    if (!isText) return;
    let cancelled = false;
    file.slice(0, 12000).text()
      .then(value => { if (!cancelled) setText(value.slice(0, 2000)); })
      .catch(() => { if (!cancelled) setText(''); });
    return () => { cancelled = true; };
  }, [file, isText]);

  const frameClass = `w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${className}`;

  if (isImage) return <img src={url} alt={`Aperçu de ${file.name}`} className={`${frameClass} h-44 object-contain`} />;
  if (isVideo) return <video src={url} controls preload="metadata" className={`${frameClass} h-44 bg-black object-contain`} />;
  if (isAudio) return <div className={`${frameClass} p-4`}><audio src={url} controls preload="metadata" className="w-full" /></div>;
  if (isPdf) return <iframe src={url ? `${url}#toolbar=0&navpanes=0` : undefined} title={`Aperçu de ${file.name}`} className={`${frameClass} h-56`} />;
  if (isText) return <pre className={`${frameClass} h-44 overflow-auto whitespace-pre-wrap p-4 text-xs text-gray-600`}>{text || 'Aperçu indisponible'}</pre>;

  return <div className={`${frameClass} flex h-32 flex-col items-center justify-center p-4 text-center`}><FileText className="mb-2 text-gray-500" /><p className="text-xs text-gray-500">Aperçu visuel non disponible pour ce format.</p></div>;
}
