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

async function createIcoBlob(image: HTMLImageElement): Promise<Blob> {
  // Modern ICO files can embed PNG-compressed icon images. A 256x256 PNG entry
  // gives good Windows/browser compatibility while keeping transparency intact.
  const size = 256;
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

  const pngBlob = await canvasToBlob(canvas, 'image/png');
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  const headerSize = 6;
  const directoryEntrySize = 16;
  const imageOffset = headerSize + directoryEntrySize;
  const output = new Uint8Array(imageOffset + pngBytes.length);
  const view = new DataView(output.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, 1, true); // one image

  // ICONDIRENTRY. Width/height value 0 represents 256 pixels in ICO.
  output[6] = 0;
  output[7] = 0;
  output[8] = 0; // color count
  output[9] = 0; // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, imageOffset, true);
  output.set(pngBytes, imageOffset);

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
          onProgress(70);
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
