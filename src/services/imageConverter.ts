const mimeTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function convertImage(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const format = outputFormat.toLowerCase();
  const mimeType = mimeTypes[format];
  if (!mimeType) throw new Error(`Le format image ${format.toUpperCase()} n'est pas disponible localement.`);

  return new Promise((resolve, reject) => {
    onProgress(10);
    const image = new Image();
    const inputUrl = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(inputUrl);

    image.onload = () => {
      onProgress(45);
      try {
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

        canvas.toBlob(blob => {
          cleanup();
          if (!blob) return reject(new Error('Le navigateur n’a pas pu encoder cette image.'));
          if (blob.type && blob.type !== mimeType) {
            return reject(new Error(`Le navigateur ne prend pas en charge l'export ${format.toUpperCase()}.`));
          }
          onProgress(100);
          resolve(URL.createObjectURL(blob));
        }, mimeType, format === 'jpg' || format === 'jpeg' ? 0.92 : undefined);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Impossible de lire l'image."));
    };
    image.src = inputUrl;
  });
}

export function isImageFormatSupported(format: string): boolean {
  return Boolean(mimeTypes[format.toLowerCase()]);
}
