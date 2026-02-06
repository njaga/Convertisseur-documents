import { ConversionFormat, FileType } from '../types/converter';

/**
 * Formats essentiels supportés (tous gratuits et illimités)
 */
export const supportedFormats: Record<FileType, ConversionFormat[]> = {
  image: [
    { extension: 'png', name: 'PNG' },
    { extension: 'jpg', name: 'JPG' },
    { extension: 'webp', name: 'WebP' },
    { extension: 'gif', name: 'GIF' },
  ],
  video: [
    { extension: 'mp4', name: 'MP4' },
    { extension: 'webm', name: 'WebM' },
    { extension: 'gif', name: 'GIF animé' },
  ],
  audio: [
    { extension: 'mp3', name: 'MP3' },
    { extension: 'wav', name: 'WAV' },
    { extension: 'ogg', name: 'OGG' },
  ],
  document: [
    { extension: 'txt', name: 'Texte' },
    { extension: 'md', name: 'Markdown' },
    { extension: 'html', name: 'HTML' },
  ],
};