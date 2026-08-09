const mimeTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Le navigateur n’a pas pu encoder cette image.'));
        return;
      }
      if (blob.type && blob.type !== mimeType) {
        reject(new Error(`Le navigateur ne prend pas en charge l'export ${mimeType}.`));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function renderSquarePng(image: HTMLImageElement, size: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible dans ce navigateur.');

  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const x = Math.round((size - width) / 2);
  const y = Math.round((size - height) / 2);

  context.clearRect(0, 0, size, size);
  context.drawImage(image, x, y, width, height);
  const blob = await canvasToBlob(canvas, 'image/png');
  return new Uint8Array(await blob.arrayBuffer());
}

async function createIcoBlob(image: HTMLImageElement): Promise<Blob> {
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map(size => renderSquarePng(image, size)));

  const headerSize = 6;
  const directoryEntrySize = 16;
  const directorySize = directoryEntrySize * images.length;
  let imageOffset = headerSize + directorySize;
  const totalSize = imageOffset + images.reduce((sum, bytes) => sum + bytes.length, 0);
  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  images.forEach((pngBytes, index) => {
    const size = sizes[index];
    const entryOffset = headerSize + index * directoryEntrySize;
    output[entryOffset] = size === 256 ? 0 : size;
    output[entryOffset + 1] = size === 256 ? 0 : size;
    output[entryOffset + 2] = 0;
    output[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, pngBytes.length, true);
    view.setUint32(entryOffset + 12, imageOffset, true);
    output.set(pngBytes, imageOffset);
    imageOffset += pngBytes.length;
  });

  return new Blob([output], { type: 'image/x-icon' });
}

export async function convertImage(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const format = outputFormat.toLowerCase();
  const mimeType = mimeTypes[format];
  if (!mimeType && format !== 'ico') {
    throw new Error(`Le format image ${format.toUpperCase()} n'est pas disponible localement.`);
  }

  return new Promise((resolve, reject) => {
    onProgress(10);
    const image = new Image();
    const inputUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(inputUrl);

    image.onload = async () => {
      onProgress(45);
      try {
        if (format === 'ico') {
          onProgress(65);
          const icoBlob = await createIcoBlob(image);
          cleanup();
          onProgress(100);
          resolve(URL.createObjectURL(icoBlob));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas indisponible dans ce navigateur.');

        if (format === 'jpg' || format === 'jpeg') {
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0);
        onProgress(75);

        const blob = await canvasToBlob(
          canvas,
          mimeType,
          format === 'jpg' || format === 'jpeg' ? 0.92 : undefined
        );
        cleanup();
        onProgress(100);
        resolve(URL.createObjectURL(blob));
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Impossible de lire l'image. Le décodage ICO dépend du navigateur utilisé."));
    };
    image.src = inputUrl;
  });
}

export function isImageFormatSupported(format: string): boolean {
  const normalized = format.toLowerCase();
  return normalized === 'ico' || Boolean(mimeTypes[normalized]);
}
