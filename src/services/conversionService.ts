/**
 * Service principal de conversion de fichiers
 * Route les conversions vers les services specialises:
 * - Images: Canvas API (local)
 * - Videos: FFmpeg.wasm (local)
 * - Audio: FFmpeg.wasm (local)
 * - Documents: Cloudmersive API (PDF, DOCX) ou local (TXT, HTML, MD)
 */

import { convertImage, isImageFormatSupported } from './imageConverter';
import { convertViaVert, isVertVideoSupported, isVertDocumentSupported } from './vertService';
import { convertAudio, isAudioFormatSupported } from './mediaConverter';
import { convertDocumentViaCloudmersive, isCloudmersiveSupported } from './cloudmersiveService';

/**
 * Determine le type de fichier a partir de son extension
 */
function getFileType(filename: string): 'image' | 'video' | 'audio' | 'document' {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  return 'document';
}

/**
 * Convertit un fichier vers le format specifie
 */
export async function convertFile(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const fileType = getFileType(file.name);
  const format = outputFormat.toLowerCase();
  const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';

  console.log(`Conversion: ${file.name} -> ${format} (type: ${fileType})`);

  try {
    switch (fileType) {
      case 'image':
        if (isImageFormatSupported(format)) {
          console.log('Conversion image via Canvas API');
          return await convertImage(file, format, onProgress);
        }
        break;

      case 'video':
        if (isVertVideoSupported(format)) {
          console.log('Conversion video via FFmpeg');
          return await convertViaVert(file, format, onProgress);
        }
        break;

      case 'audio':
        if (isAudioFormatSupported(format)) {
          console.log('Conversion audio via FFmpeg');
          return await convertAudio(file, format, onProgress);
        }
        break;

      case 'document':
        // Priorite a Cloudmersive pour PDF/DOCX
        if (isCloudmersiveSupported(inputFormat, format)) {
          console.log('Conversion document via Cloudmersive API');
          return await convertDocumentViaCloudmersive(file, format, onProgress);
        }
        // Fallback sur conversion locale (TXT, MD, HTML)
        if (isVertDocumentSupported(format)) {
          console.log('Conversion document locale');
          return await convertViaVert(file, format, onProgress);
        }
        break;
    }

    throw new Error(`Format non supporte: ${format}`);
  } catch (error) {
    console.error('Erreur de conversion:', error);
    throw error;
  }
}
