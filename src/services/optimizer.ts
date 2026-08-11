import { PDFDocument } from 'pdf-lib';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { convertVideo } from './mediaConverter';

export type QualityPreset = 'high' | 'balanced' | 'small';

export interface ImageEditOptions {
  width?: number;
  height?: number;
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  quality: QualityPreset;
  background: 'transparent' | 'white';
  crop: { x: number; y: number; width: number; height: number };
  format: 'jpeg' | 'png' | 'webp';
}

const qualities: Record<QualityPreset, number> = { high: 0.92, balanced: 0.75, small: 0.52 };
const pdfPresets: Record<QualityPreset, { scale: number; jpegQuality: number }> = {
  high: { scale: 2, jpegQuality: 0.9 },
  balanced: { scale: 1.5, jpegQuality: 0.78 },
  small: { scale: 1.1, jpegQuality: 0.6 },
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible ou corrompue.')); };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Impossible de compresser une page du PDF.'));
    }, 'image/jpeg', quality);
  });
}

export async function processImage(file: File, options: ImageEditOptions): Promise<{ blob: Blob; width: number; height: number }> {
  const image = await loadImage(file);
  const cropX = Math.round(image.naturalWidth * options.crop.x / 100);
  const cropY = Math.round(image.naturalHeight * options.crop.y / 100);
  const cropWidth = Math.max(1, Math.round(image.naturalWidth * options.crop.width / 100));
  const cropHeight = Math.max(1, Math.round(image.naturalHeight * options.crop.height / 100));
  const targetWidth = options.width || cropWidth;
  const targetHeight = options.height || Math.round(targetWidth * cropHeight / cropWidth);
  const swap = options.rotation === 90 || options.rotation === 270;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? targetHeight : targetWidth;
  canvas.height = swap ? targetWidth : targetHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible.');

  if (options.background === 'white' || options.format === 'jpeg') {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(options.rotation * Math.PI / 180);
  context.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

  const mime = options.format === 'jpeg' ? 'image/jpeg' : `image/${options.format}`;
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Encodage impossible.')), mime, qualities[options.quality]));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function compressPdf(
  file: File,
  preset: QualityPreset = 'balanced',
  onProgress: (progress: number) => void = () => undefined,
): Promise<Blob> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const settings = pdfPresets[preset];
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const source = await loadingTask.promise;
  const output = await PDFDocument.create();
  onProgress(0);

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber);
      const pageViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale: settings.scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(renderViewport.width));
      canvas.height = Math.max(1, Math.ceil(renderViewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas indisponible dans ce navigateur.');

      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport: renderViewport, background: '#fff' }).promise;

      const jpegBlob = await canvasToJpegBlob(canvas, settings.jpegQuality);
      const jpeg = await output.embedJpg(new Uint8Array(await jpegBlob.arrayBuffer()));
      const outputPage = output.addPage([pageViewport.width, pageViewport.height]);
      outputPage.drawImage(jpeg, { x: 0, y: 0, width: pageViewport.width, height: pageViewport.height });

      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      onProgress(Math.round(pageNumber / source.numPages * 100));
    }

    const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 100 });
    const compressed = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });

    // Never replace a PDF with a larger version. Already optimized PDFs can hit this path.
    return compressed.size < file.size ? compressed : file;
  } finally {
    await loadingTask.destroy();
  }
}

export function compressVideo(file: File, preset: QualityPreset, onProgress: (progress: number) => void): Promise<string> {
  // Existing FFmpeg presets already use H.264 CRF 23. The profile is represented
  // through the chosen output container until custom FFmpeg arguments are exposed.
  const output = preset === 'small' ? 'webm' : 'mp4';
  return convertVideo(file, output, onProgress);
}

export function savings(before: number, after: number): number {
  return before > 0 ? Math.round((1 - after / before) * 100) : 0;
}
