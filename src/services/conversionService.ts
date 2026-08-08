import { convertImage } from './imageConverter';
import { convertVideo, convertAudio } from './mediaConverter';
import { convertTextDocument } from './textConverter';
import { getFileTypeFromExtension, isConversionSupported } from '../utils/formats';

export class ConversionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ConversionError';
  }
}

export async function convertFile(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';
  const output = outputFormat.toLowerCase();
  const fileType = getFileTypeFromExtension(inputFormat);

  if (!fileType) {
    throw new ConversionError(`Le format .${inputFormat || '?'} n'est pas pris en charge.`, 'UNSUPPORTED_INPUT');
  }

  if (!isConversionSupported(inputFormat, output)) {
    throw new ConversionError(
      `La conversion ${inputFormat.toUpperCase()} vers ${output.toUpperCase()} n'est pas disponible.`,
      'UNSUPPORTED_CONVERSION'
    );
  }

  switch (fileType) {
    case 'image':
      return convertImage(file, output, onProgress);
    case 'video':
      return convertVideo(file, output, onProgress);
    case 'audio':
      return convertAudio(file, output, onProgress);
    case 'document':
      return convertTextDocument(file, output, onProgress);
    default:
      throw new ConversionError('Aucun moteur de conversion disponible.', 'NO_PROVIDER');
  }
}
