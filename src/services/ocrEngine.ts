const TESSERACT_VERSION = '7.0.0';
const TESSERACT_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;
const TESSERACT_WORKER_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/worker.min.js`;
const TESSERACT_CORE_URL = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT_VERSION}`;
const TESSERACT_LANGUAGE_URL = 'https://tessdata.projectnaptha.com/4.0.0';
const SCRIPT_ID = 'doxali-tesseract-js';

export type OcrEngineProgress = {
  status: string;
  progress: number;
};

type OcrSource = File | Blob | HTMLCanvasElement | HTMLImageElement | ImageBitmap;

type TesseractWorker = {
  recognize(source: OcrSource): Promise<{ data: { text: string } }>;
  terminate(): Promise<void>;
};

type TesseractApi = {
  createWorker(
    languages: string | string[],
    oem?: number,
    options?: {
      logger?: (message: OcrEngineProgress) => void;
      workerPath?: string;
      corePath?: string;
      langPath?: string;
    },
  ): Promise<TesseractWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractApi;
  }
}

let loaderPromise: Promise<TesseractApi> | null = null;

export function normalizeOcrLanguages(languages: string[]): string[] {
  const aliases: Record<string, string> = {
    fr: 'fra',
    fra: 'fra',
    french: 'fra',
    en: 'eng',
    eng: 'eng',
    english: 'eng',
  };

  const normalized = languages
    .map(language => aliases[language.trim().toLowerCase()] ?? language.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized.length ? normalized : ['fra', 'eng']));
}

function loadTesseractApi(): Promise<TesseractApi> {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<TesseractApi>((resolve, reject) => {
    if (typeof WebAssembly === 'undefined' || typeof Worker === 'undefined') {
      reject(new Error('Ce navigateur ne prend pas en charge WebAssembly ou les Web Workers nécessaires à l’OCR.'));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const cleanupFailure = () => {
      loaderPromise = null;
      if (!existing) script.remove();
    };

    const handleLoad = () => {
      if (!window.Tesseract) {
        cleanupFailure();
        reject(new Error('Le moteur OCR a été chargé mais son API est indisponible.'));
        return;
      }
      resolve(window.Tesseract);
    };

    const handleError = () => {
      cleanupFailure();
      reject(new Error('Impossible de charger le moteur OCR. Vérifiez votre connexion, votre bloqueur de contenu ou les règles réseau de votre navigateur.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  });

  return loaderPromise;
}

export interface OcrSession {
  recognize(source: OcrSource): Promise<string>;
  terminate(): Promise<void>;
}

export async function createOcrSession(
  languages: string[],
  onProgress: (progress: OcrEngineProgress) => void = () => undefined,
): Promise<OcrSession> {
  onProgress({ status: 'loading engine', progress: 0 });
  const api = await loadTesseractApi();
  const normalizedLanguages = normalizeOcrLanguages(languages);

  let worker: TesseractWorker;
  try {
    worker = await api.createWorker(normalizedLanguages, 1, {
      logger: message => onProgress({
        status: message.status,
        progress: Number.isFinite(message.progress) ? message.progress : 0,
      }),
      workerPath: TESSERACT_WORKER_URL,
      corePath: TESSERACT_CORE_URL,
      langPath: TESSERACT_LANGUAGE_URL,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Impossible d’initialiser le moteur OCR français/anglais. ${detail}`);
  }

  return {
    async recognize(source) {
      const result = await worker.recognize(source);
      return result.data.text.trim();
    },
    async terminate() {
      await worker.terminate();
    },
  };
}
