import { ConversionFormat, FileType } from '../types/converter';

/**
 * Formats supportes par l'application
 * 
 * Technologies utilisees:
 * - Images: Canvas API (conversion locale instantanee)
 * - Videos: FFmpeg.wasm (conversion locale)
 * - Audio: FFmpeg.wasm (conversion locale)
 * - Documents: Cloudmersive API (PDF, Office, etc.)
 */
export const supportedFormats: Record<FileType, ConversionFormat[]> = {
  // ───────────────────────────────────────────────────────────────
  // IMAGES - Canvas API (100% local, instantane)
  // ───────────────────────────────────────────────────────────────
  image: [
    { extension: 'png', name: 'PNG' },
    { extension: 'jpg', name: 'JPG' },
    { extension: 'jpeg', name: 'JPEG' },
    { extension: 'webp', name: 'WebP' },
    { extension: 'gif', name: 'GIF' },
    { extension: 'bmp', name: 'BMP' },
    { extension: 'ico', name: 'ICO' },
  ],

  // ───────────────────────────────────────────────────────────────
  // VIDEOS - FFmpeg.wasm (local, peut prendre du temps)
  // ───────────────────────────────────────────────────────────────
  video: [
    { extension: 'mp4', name: 'MP4' },
    { extension: 'webm', name: 'WebM' },
    { extension: 'avi', name: 'AVI' },
    { extension: 'mov', name: 'MOV' },
    { extension: 'mkv', name: 'MKV' },
    { extension: 'gif', name: 'GIF anime' },
  ],

  // ───────────────────────────────────────────────────────────────
  // AUDIO - FFmpeg.wasm (local, rapide)
  // ───────────────────────────────────────────────────────────────
  audio: [
    { extension: 'mp3', name: 'MP3' },
    { extension: 'wav', name: 'WAV' },
    { extension: 'ogg', name: 'OGG' },
    { extension: 'aac', name: 'AAC' },
    { extension: 'flac', name: 'FLAC' },
    { extension: 'm4a', name: 'M4A' },
  ],

  // ───────────────────────────────────────────────────────────────
  // DOCUMENTS - Cloudmersive API (1800 conversions/mois gratuites)
  // ───────────────────────────────────────────────────────────────
  document: [
    { extension: 'pdf', name: 'PDF' },
    { extension: 'docx', name: 'Word' },
    { extension: 'xlsx', name: 'Excel' },
    { extension: 'pptx', name: 'PowerPoint' },
    { extension: 'txt', name: 'Texte' },
    { extension: 'html', name: 'HTML' },
    { extension: 'csv', name: 'CSV' },
  ],
};

/**
 * Formats d'entree acceptes par type de fichier
 * (pour la detection automatique du type)
 */
export const inputFormats: Record<FileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'heif', 'svg'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v', 'flv', 'wmv', 'mpeg', 'mpg'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'aiff', 'opus'],
  document: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'rtf', 'odt', 'html', 'htm', 'csv', 'md'],
};

/**
 * Obtenir le type de fichier a partir de l'extension
 */
export function getFileTypeFromExtension(extension: string): FileType {
  const ext = extension.toLowerCase();

  for (const [type, formats] of Object.entries(inputFormats)) {
    if (formats.includes(ext)) {
      return type as FileType;
    }
  }

  return 'document'; // Par defaut
}