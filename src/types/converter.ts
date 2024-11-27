export type FileType = 'document' | 'image' | 'video' | 'audio';

export interface ConversionFormat {
  name: string;
  extension: string;
  icon?: string;
}

export const formats: Record<FileType, ConversionFormat[]> = {
  document: [
    { name: 'PDF', extension: 'pdf' },
    { name: 'WORD', extension: 'docx' },
    { name: 'WORD Legacy', extension: 'doc' },
    { name: 'TXT', extension: 'txt' },
    { name: 'RTF', extension: 'rtf' },
    { name: 'ODT', extension: 'odt' },
    { name: 'PAGES', extension: 'pages' },
    { name: 'MARKDOWN', extension: 'md' },
    { name: 'HTML', extension: 'html' },
    { name: 'EPUB', extension: 'epub' },
    { name: 'EXCEL', extension: 'xlsx' },
    { name: 'EXCEL Legacy', extension: 'xls' },
    { name: 'CSV', extension: 'csv' },
    { name: 'ODS', extension: 'ods' },
    { name: 'NUMBERS', extension: 'numbers' },
    { name: 'POWERPOINT', extension: 'pptx' },
    { name: 'POWERPOINT Legacy', extension: 'ppt' },
    { name: 'ODP', extension: 'odp' },
    { name: 'KEYNOTE', extension: 'key' },
    { name: 'LaTeX', extension: 'tex' },
    { name: 'XML', extension: 'xml' },
    { name: 'JSON', extension: 'json' },
    { name: 'YAML', extension: 'yaml' },
    { name: 'MOBI', extension: 'mobi' },
    { name: 'FB2', extension: 'fb2' },
    { name: 'CHM', extension: 'chm' },
    { name: 'DjVu', extension: 'djvu' },
  ],
  image: [
    { name: 'JPG', extension: 'jpg' },
    { name: 'JPEG', extension: 'jpeg' },
    { name: 'PNG', extension: 'png' },
    { name: 'WEBP', extension: 'webp' },
    { name: 'GIF', extension: 'gif' },
    { name: 'BMP', extension: 'bmp' },
    { name: 'TIFF', extension: 'tiff' },
    { name: 'SVG', extension: 'svg' },
    { name: 'ICO', extension: 'ico' },
    { name: 'HEIC', extension: 'heic' },
  ],
  video: [
    { name: 'MP4', extension: 'mp4' },
    { name: 'MOV', extension: 'mov' },
    { name: 'AVI', extension: 'avi' },
    { name: 'MKV', extension: 'mkv' },
    { name: 'WMV', extension: 'wmv' },
    { name: 'FLV', extension: 'flv' },
    { name: 'WEBM', extension: 'webm' },
    { name: '3GP', extension: '3gp' },
    { name: 'M4V', extension: 'm4v' },
    { name: 'MPEG', extension: 'mpeg' },
  ],
  audio: [
    { name: 'MP3', extension: 'mp3' },
    { name: 'WAV', extension: 'wav' },
    { name: 'AAC', extension: 'aac' },
    { name: 'OGG', extension: 'ogg' },
    { name: 'FLAC', extension: 'flac' },
    { name: 'M4A', extension: 'm4a' },
    { name: 'WMA', extension: 'wma' },
    { name: 'AIFF', extension: 'aiff' },
    { name: 'AMR', extension: 'amr' },
    { name: 'OPUS', extension: 'opus' },
  ],
};

export interface ConversionJob {
  id: string;
  inputFile: File;
  outputFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  outputUrl?: string;
}