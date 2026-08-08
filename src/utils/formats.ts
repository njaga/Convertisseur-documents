import { ConversionFormat, FileType } from '../types/converter';
import { isOfficeConverterConfigured, isOfficeInputFormat } from '../services/officeConverter';

export type SupportedFileFormat =
  | 'png' | 'jpg' | 'jpeg' | 'webp' | 'ico'
  | 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm' | 'gif'
  | 'mp3' | 'wav' | 'ogg' | 'flac' | 'm4a' | 'aac'
  | 'txt' | 'md' | 'html'
  | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'odt' | 'ods' | 'odp' | 'pdf';

const labels: Record<string, string> = {
  png: 'PNG', jpg: 'JPG', jpeg: 'JPEG', webp: 'WebP', ico: 'ICO',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI', mkv: 'MKV', webm: 'WebM', gif: 'GIF animé',
  mp3: 'MP3', wav: 'WAV', ogg: 'OGG', flac: 'FLAC', m4a: 'M4A', aac: 'AAC',
  txt: 'Texte', md: 'Markdown', html: 'HTML',
  doc: 'Word DOC', docx: 'Word DOCX', xls: 'Excel XLS', xlsx: 'Excel XLSX',
  ppt: 'PowerPoint PPT', pptx: 'PowerPoint PPTX', odt: 'OpenDocument ODT',
  ods: 'OpenDocument ODS', odp: 'OpenDocument ODP', pdf: 'PDF',
};

export const conversionMatrix: Record<string, string[]> = {
  png: ['jpg', 'jpeg', 'webp', 'ico'],
  jpg: ['png', 'webp', 'ico'],
  jpeg: ['png', 'webp', 'ico'],
  webp: ['png', 'jpg', 'jpeg', 'ico'],
  ico: ['png', 'jpg', 'jpeg', 'webp'],

  mp4: ['webm', 'avi', 'mkv', 'mov', 'gif'],
  webm: ['mp4', 'avi', 'mkv', 'mov', 'gif'],
  avi: ['mp4', 'webm', 'mkv', 'mov', 'gif'],
  mkv: ['mp4', 'webm', 'avi', 'mov', 'gif'],
  mov: ['mp4', 'webm', 'avi', 'mkv', 'gif'],

  mp3: ['wav', 'ogg', 'flac', 'm4a', 'aac'],
  wav: ['mp3', 'ogg', 'flac', 'm4a', 'aac'],
  ogg: ['mp3', 'wav', 'flac', 'm4a', 'aac'],
  flac: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  m4a: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
  aac: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],

  txt: ['html', 'md'],
  md: ['html', 'txt'],
  html: ['txt', 'md'],
};

export const officeInputFormats = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];

export const inputFormats: Record<FileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'ico'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
  document: ['txt', 'md', 'html', ...officeInputFormats],
};

function enabledInputFormats(type: FileType): string[] {
  if (type !== 'document' || isOfficeConverterConfigured()) return inputFormats[type];
  return inputFormats.document.filter(extension => !isOfficeInputFormat(extension));
}

export const supportedFormats: Record<FileType, ConversionFormat[]> = {
  image: inputFormats.image.map(extension => ({ extension, name: labels[extension] })),
  video: [...inputFormats.video, 'gif'].map(extension => ({ extension, name: labels[extension] })),
  audio: inputFormats.audio.map(extension => ({ extension, name: labels[extension] })),
  document: enabledInputFormats('document').map(extension => ({ extension, name: labels[extension] })),
};

export function getFileTypeFromExtension(extension: string): FileType | null {
  const ext = extension.toLowerCase();
  for (const [type, formats] of Object.entries(inputFormats)) {
    if (formats.includes(ext)) return type as FileType;
  }
  return null;
}

export function getAvailableOutputFormats(sourceFormat: string): ConversionFormat[] {
  const source = sourceFormat.toLowerCase();
  if (isOfficeInputFormat(source)) {
    return isOfficeConverterConfigured() ? [{ extension: 'pdf', name: labels.pdf }] : [];
  }
  const outputs = conversionMatrix[source] ?? [];
  return outputs.map(extension => ({ extension, name: labels[extension] ?? extension.toUpperCase() }));
}

export function isConversionSupported(inputFormat: string, outputFormat: string): boolean {
  const input = inputFormat.toLowerCase();
  const output = outputFormat.toLowerCase();
  if (isOfficeInputFormat(input)) return isOfficeConverterConfigured() && output === 'pdf';
  return (conversionMatrix[input] ?? []).includes(output);
}

export function getAllAcceptedExtensions(): string[] {
  return [...new Set((Object.keys(inputFormats) as FileType[]).flatMap(enabledInputFormats))];
}
