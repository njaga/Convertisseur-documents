const officeExtensions = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp']);

export function isOfficeInputFormat(extension: string): boolean {
  return officeExtensions.has(extension.toLowerCase());
}

export function isOfficeConverterConfigured(): boolean {
  return Boolean(import.meta.env.VITE_OFFICE_CONVERTER_URL?.trim());
}

export async function convertOfficeDocument(
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> {
  if (outputFormat.toLowerCase() !== 'pdf') {
    throw new Error('Le moteur Office ne produit actuellement que du PDF.');
  }

  const baseUrl = import.meta.env.VITE_OFFICE_CONVERTER_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('Le service de conversion Office n’est pas configuré sur ce déploiement.');
  }

  onProgress(10);
  const response = await fetch(`${baseUrl}/convert/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });

  onProgress(85);
  if (!response.ok) {
    let message = `La conversion Office a échoué (${response.status}).`;
    try {
      const payload = await response.json() as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the generic HTTP error when the service does not return JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (blob.type && blob.type !== 'application/pdf') {
    throw new Error('Le service Office a retourné un fichier inattendu.');
  }
  onProgress(100);
  return URL.createObjectURL(blob);
}
