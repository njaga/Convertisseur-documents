import axios, { AxiosProgressEvent } from 'axios';

// URL de développement local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const convertFile = async (
  file: File,
  outputFormat: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  if (DEV_MODE) {
    // Mode développement : simulation de conversion
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve(URL.createObjectURL(file));
        }
      }, 500);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('outputFormat', outputFormat);

  try {
    // Simulation de progression pour le développement
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        onProgress(progress);
      }
    }, 500);

    const response = await axios.post(`${API_URL}/convert`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const uploadProgress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.min(90, uploadProgress)); // Limite à 90% jusqu'à la fin du traitement
        }
      },
    });

    clearInterval(progressInterval);
    onProgress(100);

    // Pour le développement, vous pouvez retourner une URL simulée
    return response.data.url || URL.createObjectURL(new Blob([file]));
  } catch (error) {
    console.error('Erreur de conversion:', error);
    throw new Error('Erreur lors de la conversion');
  }
};

// Configuration d'Axios pour le développement
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 30000; // 30 secondes
