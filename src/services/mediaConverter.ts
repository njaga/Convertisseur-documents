import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;
let currentProgressCallback: ((progress: number) => void) | null = null;
let operationQueue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(task, task);
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpegLoaded) return ffmpeg;

  const instance = new FFmpeg();
  instance.on('progress', ({ progress }) => {
    if (!currentProgressCallback) return;
    const mappedProgress = 30 + Math.round(progress * 60);
    currentProgressCallback(Math.min(Math.max(mappedProgress, 30), 90));
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await instance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpeg = instance;
  ffmpegLoaded = true;
  return instance;
}

function makeJobNames(file: File, outputFormat: string) {
  const inputExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    inputName: `input-${id}.${inputExtension}`,
    outputName: `output-${id}.${outputFormat.toLowerCase()}`,
  };
}

async function safeDelete(ff: FFmpeg, path: string) {
  try {
    await ff.deleteFile(path);
  } catch {
    // The file may not have been created when FFmpeg fails early.
  }
}

export function convertVideo(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return enqueue(async () => {
    onProgress(5);
    const ff = await initFFmpeg();
    onProgress(20);
    currentProgressCallback = onProgress;

    const format = outputFormat.toLowerCase();
    const args = getVideoArgs(format);
    if (!args) throw new Error(`Le format video ${format.toUpperCase()} n'est pas supporte.`);

    const { inputName, outputName } = makeJobNames(file, format);

    try {
      await ff.writeFile(inputName, await fetchFile(file));
      onProgress(25);

      const exitCode = await ff.exec(['-i', inputName, ...args, outputName]);
      if (exitCode !== 0) throw new Error(`FFmpeg a termine avec le code ${exitCode}.`);

      const data = await ff.readFile(outputName);
      onProgress(95);
      const blob = new Blob([data as unknown as BlobPart], { type: getVideoMimeType(format) });
      onProgress(100);
      return URL.createObjectURL(blob);
    } finally {
      currentProgressCallback = null;
      await safeDelete(ff, inputName);
      await safeDelete(ff, outputName);
    }
  });
}

export function convertAudio(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return enqueue(async () => {
    onProgress(5);
    const ff = await initFFmpeg();
    onProgress(20);
    currentProgressCallback = onProgress;

    const format = outputFormat.toLowerCase();
    const args = getAudioArgs(format);
    if (!args) throw new Error(`Le format audio ${format.toUpperCase()} n'est pas supporte.`);

    const { inputName, outputName } = makeJobNames(file, format);

    try {
      await ff.writeFile(inputName, await fetchFile(file));
      onProgress(25);

      const exitCode = await ff.exec(['-i', inputName, ...args, outputName]);
      if (exitCode !== 0) throw new Error(`FFmpeg a termine avec le code ${exitCode}.`);

      const data = await ff.readFile(outputName);
      onProgress(95);
      const blob = new Blob([data as unknown as BlobPart], { type: getAudioMimeType(format) });
      onProgress(100);
      return URL.createObjectURL(blob);
    } finally {
      currentProgressCallback = null;
      await safeDelete(ff, inputName);
      await safeDelete(ff, outputName);
    }
  });
}

function getVideoArgs(format: string): string[] | null {
  switch (format) {
    case 'mp4': return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac'];
    case 'webm': return ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus'];
    case 'gif': return ['-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0'];
    case 'avi': return ['-c:v', 'mpeg4', '-c:a', 'mp3'];
    case 'mkv': return ['-c:v', 'libx264', '-c:a', 'aac'];
    case 'mov': return ['-c:v', 'libx264', '-c:a', 'aac', '-f', 'mov'];
    default: return null;
  }
}

function getAudioArgs(format: string): string[] | null {
  switch (format) {
    case 'mp3': return ['-c:a', 'libmp3lame', '-q:a', '2'];
    case 'wav': return ['-c:a', 'pcm_s16le'];
    case 'ogg': return ['-c:a', 'libvorbis', '-q:a', '4'];
    case 'aac': return ['-c:a', 'aac', '-b:a', '192k'];
    case 'flac': return ['-c:a', 'flac'];
    case 'm4a': return ['-c:a', 'aac', '-b:a', '192k'];
    default: return null;
  }
}

function getVideoMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
    mkv: 'video/x-matroska', mov: 'video/quicktime', gif: 'image/gif',
  };
  return mimeTypes[format] ?? 'application/octet-stream';
}

function getAudioMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4',
  };
  return mimeTypes[format] ?? 'application/octet-stream';
}

export function isVideoFormatSupported(format: string): boolean {
  return getVideoArgs(format.toLowerCase()) !== null;
}

export function isAudioFormatSupported(format: string): boolean {
  return getAudioArgs(format.toLowerCase()) !== null;
}
