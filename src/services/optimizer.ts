import { PDFDocument } from 'pdf-lib';
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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible ou corrompue.')); };
    image.src = url;
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

export async function compressPdf(file: File): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 100 });
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
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
