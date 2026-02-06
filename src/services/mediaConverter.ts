/**
 * Service de conversion vidéo/audio utilisant FFmpeg.wasm
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Initialise FFmpeg.wasm
 */
async function initFFmpeg(onProgress: (progress: number) => void): Promise<FFmpeg> {
    if (ffmpeg && ffmpegLoaded) {
        return ffmpeg;
    }

    ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
        // FFmpeg progress va de 0 à 1, on le convertit en 30-90%
        const mappedProgress = 30 + Math.round(progress * 60);
        onProgress(Math.min(mappedProgress, 90));
    });

    onProgress(5);

    // Chargement des fichiers core depuis unpkg CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
    onProgress(20);

    return ffmpeg;
}

/**
 * Convertit une vidéo vers un autre format
 */
export async function convertVideo(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    const ff = await initFFmpeg(onProgress);

    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    // Écrire le fichier d'entrée
    await ff.writeFile(inputName, await fetchFile(file));
    onProgress(25);

    // Exécuter la conversion
    const ffmpegArgs = getVideoArgs(outputFormat);
    await ff.exec(['-i', inputName, ...ffmpegArgs, outputName]);

    // Lire le fichier de sortie
    const data = await ff.readFile(outputName);
    onProgress(95);

    // Créer le blob et l'URL
    const mimeType = getVideoMimeType(outputFormat);
    const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Nettoyer les fichiers
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    onProgress(100);
    return url;
}

/**
 * Convertit un fichier audio vers un autre format
 */
export async function convertAudio(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    const ff = await initFFmpeg(onProgress);

    const inputName = `input.${file.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    await ff.writeFile(inputName, await fetchFile(file));
    onProgress(25);

    const ffmpegArgs = getAudioArgs(outputFormat);
    await ff.exec(['-i', inputName, ...ffmpegArgs, outputName]);

    const data = await ff.readFile(outputName);
    onProgress(95);

    const mimeType = getAudioMimeType(outputFormat);
    const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    onProgress(100);
    return url;
}

function getVideoArgs(format: string): string[] {
    switch (format.toLowerCase()) {
        case 'mp4':
            return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac'];
        case 'webm':
            return ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus'];
        case 'gif':
            return ['-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0'];
        case 'avi':
            return ['-c:v', 'mpeg4', '-c:a', 'mp3'];
        case 'mkv':
            return ['-c:v', 'libx264', '-c:a', 'aac'];
        case 'mov':
            return ['-c:v', 'libx264', '-c:a', 'aac', '-f', 'mov'];
        default:
            return [];
    }
}

function getAudioArgs(format: string): string[] {
    switch (format.toLowerCase()) {
        case 'mp3':
            return ['-c:a', 'libmp3lame', '-q:a', '2'];
        case 'wav':
            return ['-c:a', 'pcm_s16le'];
        case 'ogg':
            return ['-c:a', 'libvorbis', '-q:a', '4'];
        case 'aac':
            return ['-c:a', 'aac', '-b:a', '192k'];
        case 'flac':
            return ['-c:a', 'flac'];
        case 'm4a':
            return ['-c:a', 'aac', '-b:a', '192k'];
        default:
            return [];
    }
}

function getVideoMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
        mov: 'video/quicktime',
        gif: 'image/gif',
    };
    return mimeTypes[format.toLowerCase()] || 'video/mp4';
}

function getAudioMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        flac: 'audio/flac',
        m4a: 'audio/mp4',
        wma: 'audio/x-ms-wma',
    };
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
}

/**
 * Vérifie si le format vidéo est supporté
 */
export function isVideoFormatSupported(format: string): boolean {
    return ['mp4', 'webm', 'avi', 'mkv', 'mov', 'gif'].includes(format.toLowerCase());
}

/**
 * Vérifie si le format audio est supporté
 */
export function isAudioFormatSupported(format: string): boolean {
    return ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(format.toLowerCase());
}
