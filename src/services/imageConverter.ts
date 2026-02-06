/**
 * Service de conversion d'images utilisant Canvas API
 */

const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
};

/**
 * Convertit une image vers un autre format en utilisant Canvas
 */
export async function convertImage(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        onProgress(10);

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            onProgress(30);
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));

        img.onload = () => {
            onProgress(50);

            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Impossible de créer le contexte Canvas');
                }

                // Fond blanc pour les formats sans transparence (JPG/JPEG)
                if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);
                onProgress(70);

                const mimeType = mimeTypes[outputFormat.toLowerCase()] || 'image/png';
                const quality = outputFormat === 'jpg' || outputFormat === 'jpeg' ? 0.92 : undefined;

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            onProgress(100);
                            const url = URL.createObjectURL(blob);
                            resolve(url);
                        } else {
                            reject(new Error('Erreur lors de la création du blob'));
                        }
                    },
                    mimeType,
                    quality
                );
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));

        reader.readAsDataURL(file);
    });
}

/**
 * Vérifie si le format est supporté par le convertisseur d'images
 */
export function isImageFormatSupported(format: string): boolean {
    return Object.keys(mimeTypes).includes(format.toLowerCase());
}
