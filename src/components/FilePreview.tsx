import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Presentation, Table2 } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface FilePreviewProps {
  file: File;
  className?: string;
}

function PdfThumbnail({ file, className }: { file: File; className: string }) {
  const [preview, setPreview] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let previewUrl = '';
    let loadingTask: { destroy(): Promise<void> } | null = null;

    const render = async () => {
      try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        loadingTask = task;
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas indisponible.');
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Aperçu PDF indisponible.')), 'image/png'));
        previewUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPreview(previewUrl);
          setPageCount(pdf.numPages);
        }
        page.cleanup();
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void render();
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (loadingTask) void loadingTask.destroy();
    };
  }, [file]);

  const frame = `relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${className}`;
  if (failed) return <div className={`${frame} flex h-44 flex-col items-center justify-center p-4 text-center`}><FileText className="mb-2 text-red-500" /><p className="text-xs text-gray-500">Impossible de générer l’aperçu de ce PDF.</p></div>;
  if (!preview) return <div className={`${frame} flex h-44 items-center justify-center gap-2 text-xs text-gray-500`}><Loader2 size={15} className="animate-spin" /> Aperçu du PDF…</div>;

  return (
    <div className={frame}>
      <img src={preview} alt={`Première page de ${file.name}`} className="h-56 w-full bg-white object-contain" />
      <span className="absolute bottom-2 right-2 rounded-full bg-gray-950/85 px-2 py-1 text-[10px] font-semibold text-white">{pageCount} page{pageCount > 1 ? 's' : ''}</span>
    </div>
  );
}

export default function FilePreview({ file, className = '' }: FilePreviewProps) {
  const [text, setText] = useState('');
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'].includes(extension);
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPdf = file.type === 'application/pdf' || extension === 'pdf';
  const isText = file.type.startsWith('text/') || ['txt', 'md', 'html'].includes(extension);
  const isSheet = ['xls', 'xlsx', 'ods'].includes(extension);
  const isSlides = ['ppt', 'pptx', 'odp'].includes(extension);
  const isWord = ['doc', 'docx', 'odt'].includes(extension);

  const needsObjectUrl = isImage || isVideo || isAudio;
  const url = useMemo(() => needsObjectUrl ? URL.createObjectURL(file) : '', [file, needsObjectUrl]);

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
  if (isPdf) return <PdfThumbnail key={`${file.name}-${file.size}-${file.lastModified}`} file={file} className={className} />;
  if (isText) return <pre className={`${frameClass} h-44 overflow-auto whitespace-pre-wrap p-4 text-xs text-gray-600`}>{text || 'Aperçu indisponible'}</pre>;

  if (isSheet || isSlides || isWord) {
    const Icon = isSheet ? Table2 : isSlides ? Presentation : FileText;
    return (
      <div className={`${frameClass} flex h-36 flex-col items-center justify-center p-4 text-center`}>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm"><Icon size={20} /></div>
        <p className="text-xs font-semibold uppercase text-gray-700">{extension}</p>
        <p className="mt-1 text-[11px] text-gray-500">L’aperçu visuel complet sera disponible après conversion en PDF.</p>
      </div>
    );
  }

  return <div className={`${frameClass} flex h-32 flex-col items-center justify-center p-4 text-center`}><FileText className="mb-2 text-gray-500" /><p className="text-xs text-gray-500">Aperçu visuel non disponible pour ce format.</p></div>;
}
