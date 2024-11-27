import { ConversionFormat, FileType } from '../types/converter';

export const supportedFormats: Record<FileType, ConversionFormat[]> = {
  image: [
    { extension: 'jpg', name: 'JPEG', type: 'image' },
    { extension: 'png', name: 'PNG', type: 'image' },
    { extension: 'webp', name: 'WebP', type: 'image' },
    { extension: 'gif', name: 'GIF', type: 'image' }
  ],
  video: [
    { extension: 'mp4', name: 'MP4', type: 'video' },
    { extension: 'webm', name: 'WebM', type: 'video' },
    { extension: 'gif', name: 'GIF', type: 'video' }
  ],
  audio: [
    { extension: 'mp3', name: 'MP3', type: 'audio' },
    { extension: 'wav', name: 'WAV', type: 'audio' },
    { extension: 'ogg', name: 'OGG', type: 'audio' }
  ],
  document: [
    { extension: 'pdf', name: 'PDF', type: 'document' },
    { extension: 'txt', name: 'Text', type: 'document' },
    { extension: 'md', name: 'Markdown', type: 'document' }
  ]
};