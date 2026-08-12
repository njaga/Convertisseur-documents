import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { saveHistory } from './history';
import { createOcrSession, type OcrEngineProgress, type OcrSession } from './ocrEngine';
import { PdfOutput } from './pdfTools';

function pdfBlobFromBytes(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

async function outputFromPdfBytes(name: string, operation: string, bytes: Uint8Array): Promise<PdfOutput> {
  const blob = pdfBlobFromBytes(bytes);
  await saveHistory(name, operation, blob).catch(() => undefined);
  return { name, url: URL.createObjectURL(blob) };
}

async function imageAsPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible.');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Signature illisible.')), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function generateDocument(input: { title: string; body: string; footer?: string; logo?: File; accent: string }): Promise<PdfOutput> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const color = input.accent.match(/^#([0-9a-f]{6})$/i)?.[1] ?? '111827';
  const accent = rgb(parseInt(color.slice(0, 2), 16) / 255, parseInt(color.slice(2, 4), 16) / 255, parseInt(color.slice(4, 6), 16) / 255);
  const margin = 52;
  const size = [595.28, 841.89] as const;
  let page = pdf.addPage([...size]);
  let y = size[1] - margin;

  if (input.logo) {
    const logo = await pdf.embedPng(await imageAsPng(input.logo));
    const scaled = logo.scaleToFit(100, 52);
    page.drawImage(logo, { x: margin, y: y - scaled.height, width: scaled.width, height: scaled.height });
    y -= scaled.height + 22;
  }
  page.drawText(input.title || 'Document', { x: margin, y: y - 28, size: 24, font: bold, color: accent });
  y -= 62;
  page.drawRectangle({ x: margin, y, width: size[0] - margin * 2, height: 2, color: accent });
  y -= 28;

  const words = input.body.replace(/\r/g, '').split(/\s+/);
  let line = '';
  const lines: string[] = [];
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (regular.widthOfTextAtSize(candidate, 11) > size[0] - margin * 2) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);

  for (const value of lines) {
    if (y < 70) {
      page = pdf.addPage([...size]);
      y = size[1] - margin;
    }
    page.drawText(value, { x: margin, y, size: 11, font: regular, color: rgb(.15, .18, .22) });
    y -= 17;
  }
  if (input.footer) page.drawText(input.footer, { x: margin, y: 30, size: 8, font: regular, color: rgb(.45, .48, .52) });
  const bytes = await pdf.save();
  const name = `${(input.title || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  return outputFromPdfBytes(name, 'Création de PDF', bytes);
}

export interface AnnotatePdfInput {
  pdf: File;
  page: number;
  text?: string;
  signature?: File;
  x: number;
  y: number;
  width: number;
  blackout?: boolean;
  signatureX?: number;
  signatureY?: number;
  signatureWidth?: number;
}

export async function annotatePdf(input: AnnotatePdfInput): Promise<PdfOutput> {
  const document = await PDFDocument.load(await input.pdf.arrayBuffer());
  if (input.page < 1 || input.page > document.getPageCount()) throw new Error('Numéro de page invalide.');
  const page = document.getPage(input.page - 1);
  const { width, height } = page.getSize();
  const annotationX = width * input.x / 100;
  const annotationY = height * (1 - input.y / 100);

  if (input.blackout) {
    page.drawRectangle({
      x: annotationX,
      y: annotationY - 24,
      width: width * input.width / 100,
      height: 28,
      color: rgb(0, 0, 0),
    });
  }

  if (input.text) {
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText(input.text, {
      x: annotationX,
      y: annotationY,
      size: 12,
      font,
      color: rgb(.05, .05, .05),
      maxWidth: width * input.width / 100,
    });
  }

  if (input.signature) {
    const signature = await document.embedPng(await imageAsPng(input.signature));
    const signatureX = width * (input.signatureX ?? input.x) / 100;
    const signatureTop = height * (1 - (input.signatureY ?? input.y) / 100);
    const renderedWidth = width * (input.signatureWidth ?? input.width) / 100;
    const renderedHeight = renderedWidth * (signature.height / signature.width);
    page.drawImage(signature, {
      x: signatureX,
      y: signatureTop - renderedHeight,
      width: renderedWidth,
      height: renderedHeight,
    });
  }

  const bytes = await document.save();
  const name = `${input.pdf.name.replace(/\.pdf$/i, '')}-annote.pdf`;
  return outputFromPdfBytes(name, input.signature ? 'Signature et annotation PDF' : 'Annotation PDF', bytes);
}

async function saveOcrResult(file: File, text: string) {
  if (!text.trim()) return;
  const name = `${file.name.replace(/\.[^.]+$/, '')}-ocr.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  await saveHistory(name, 'OCR PDF & images', blob).catch(() => undefined);
}

export type OcrRunProgress = {
  progress: number;
  message: string;
  page?: number;
  pageCount?: number;
};

function describeEngineProgress(progress: OcrEngineProgress): string {
  const status = progress.status.toLowerCase();
  if (status.includes('loading language')) return 'Chargement des modèles français et anglais…';
  if (status.includes('loading tesseract core') || status.includes('loading engine')) return 'Chargement du moteur OCR…';
  if (status.includes('initializing')) return 'Initialisation du moteur OCR…';
  if (status.includes('recognizing text')) return 'Reconnaissance du texte…';
  return 'Préparation de la reconnaissance…';
}

function textFromPdfItems(items: unknown[]): string {
  let text = '';
  for (const item of items) {
    if (!item || typeof item !== 'object' || !('str' in item)) continue;
    const value = String((item as { str?: unknown }).str ?? '');
    if (!value) continue;
    text += value;
    text += (item as { hasEOL?: boolean }).hasEOL ? '\n' : ' ';
  }
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasUsefulEmbeddedText(text: string): boolean {
  return text.replace(/\s/g, '').length >= 24;
}

export async function runLocalOcr(
  file: File,
  languages: string[],
  onProgress: (progress: OcrRunProgress) => void = () => undefined,
): Promise<string> {
  let result = '';

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    let session: OcrSession | null = null;
    let activePage = 1;

    const getSession = async () => {
      if (session) return session;
      session = await createOcrSession(languages, engineProgress => {
        const pageFraction = engineProgress.status.toLowerCase().includes('recognizing text')
          ? Math.min(1, Math.max(0, engineProgress.progress))
          : 0;
        const overall = ((activePage - 1) + pageFraction) / Math.max(1, pdf.numPages) * 100;
        onProgress({
          progress: Math.min(99, Math.round(overall)),
          message: describeEngineProgress(engineProgress),
          page: activePage,
          pageCount: pdf.numPages,
        });
      });
      return session;
    };

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        activePage = pageNumber;
        onProgress({
          progress: Math.round((pageNumber - 1) / pdf.numPages * 100),
          message: `Lecture de la page ${pageNumber}/${pdf.numPages}…`,
          page: pageNumber,
          pageCount: pdf.numPages,
        });

        const page = await pdf.getPage(pageNumber);
        try {
          const textContent = await page.getTextContent();
          const embeddedText = textFromPdfItems(textContent.items);
          if (hasUsefulEmbeddedText(embeddedText)) {
            pageTexts.push(embeddedText);
            onProgress({
              progress: Math.round(pageNumber / pdf.numPages * 100),
              message: `Texte intégré récupéré · page ${pageNumber}/${pdf.numPages}`,
              page: pageNumber,
              pageCount: pdf.numPages,
            });
            continue;
          }

          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.ceil(viewport.width));
          canvas.height = Math.max(1, Math.ceil(viewport.height));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas indisponible pour analyser cette page.');

          await page.render({ canvas, canvasContext: context, viewport, background: '#fff' }).promise;
          const worker = await getSession();
          pageTexts.push(await worker.recognize(canvas));
          canvas.width = 0;
          canvas.height = 0;

          onProgress({
            progress: Math.round(pageNumber / pdf.numPages * 100),
            message: `Page ${pageNumber}/${pdf.numPages} analysée`,
            page: pageNumber,
            pageCount: pdf.numPages,
          });
        } finally {
          page.cleanup();
        }
      }
    } finally {
      if (session) await session.terminate().catch(() => undefined);
      await loadingTask.destroy();
    }

    result = pageTexts.map((text, index) => `--- Page ${index + 1} ---\n${text.trim()}`).join('\n\n').trim();
  } else {
    const session = await createOcrSession(languages, engineProgress => {
      const recognitionProgress = engineProgress.status.toLowerCase().includes('recognizing text')
        ? Math.round(Math.min(1, Math.max(0, engineProgress.progress)) * 100)
        : 0;
      onProgress({ progress: recognitionProgress, message: describeEngineProgress(engineProgress), page: 1, pageCount: 1 });
    });
    try {
      result = await session.recognize(file);
    } finally {
      await session.terminate().catch(() => undefined);
    }
  }

  if (!result.trim()) throw new Error('Aucun texte lisible n’a été détecté dans ce document. Essayez un scan plus net ou une image de meilleure résolution.');
  onProgress({ progress: 100, message: 'Reconnaissance terminée.' });
  await saveOcrResult(file, result);
  return result;
}
