import { degrees, PDFDocument } from 'pdf-lib';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface PdfOutput {
  name: string;
  url: string;
}

function bytesToPdfUrl(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return URL.createObjectURL(new Blob([copy.buffer], { type: 'application/pdf' }));
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('Impossible de générer l’image PNG.'));
      else resolve(blob);
    }, 'image/png');
  });
}

async function fileToPngBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas indisponible dans ce navigateur.');

        context.drawImage(image, 0, 0);
        canvas.toBlob(async blob => {
          cleanup();
          if (!blob) {
            reject(new Error(`Impossible de préparer ${file.name} pour le PDF.`));
            return;
          }
          resolve(new Uint8Array(await blob.arrayBuffer()));
        }, 'image/png');
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();
      reject(new Error(`Impossible de lire l'image ${file.name}.`));
    };

    image.src = url;
  });
}

export async function imagesToPdf(files: File[]): Promise<PdfOutput> {
  if (files.length === 0) throw new Error('Ajoutez au moins une image.');

  const pdf = await PDFDocument.create();
  for (const file of files) {
    const pngBytes = await fileToPngBytes(file);
    const image = await pdf.embedPng(pngBytes);
    const { width, height } = image.scale(1);
    const page = pdf.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  const bytes = await pdf.save();
  return { name: 'images-converties.pdf', url: bytesToPdfUrl(bytes) };
}

export async function mergePdfs(files: File[]): Promise<PdfOutput> {
  if (files.length < 2) throw new Error('Ajoutez au moins deux fichiers PDF à fusionner.');

  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
  }

  const bytes = await output.save();
  return { name: 'pdf-fusionne.pdf', url: bytesToPdfUrl(bytes) };
}

export async function splitPdf(file: File): Promise<PdfOutput[]> {
  const source = await PDFDocument.load(await file.arrayBuffer());
  if (source.getPageCount() === 0) throw new Error('Ce PDF ne contient aucune page.');

  const outputs: PdfOutput[] = [];
  for (let index = 0; index < source.getPageCount(); index += 1) {
    const pagePdf = await PDFDocument.create();
    const [page] = await pagePdf.copyPages(source, [index]);
    pagePdf.addPage(page);
    const bytes = await pagePdf.save();
    outputs.push({
      name: `${file.name.replace(/\.pdf$/i, '')}-page-${index + 1}.pdf`,
      url: bytesToPdfUrl(bytes),
    });
  }

  return outputs;
}

export async function rotatePdf(file: File, angle: 90 | 180 | 270): Promise<PdfOutput> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  pdf.getPages().forEach(page => {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  });

  const bytes = await pdf.save();
  return {
    name: `${file.name.replace(/\.pdf$/i, '')}-rotation-${angle}.pdf`,
    url: bytesToPdfUrl(bytes),
  };
}

export async function pdfToPngs(file: File, scale = 2): Promise<PdfOutput[]> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const outputs: PdfOutput[] = [];
  const baseName = file.name.replace(/\.pdf$/i, '');

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas indisponible dans ce navigateur.');

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await canvasToPngBlob(canvas);
      outputs.push({
        name: `${baseName}-page-${pageNumber}.png`,
        url: URL.createObjectURL(blob),
      });
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  return outputs;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  return pdf.getPageCount();
}

export function parsePageSelection(value: string, pageCount: number): number[] {
  const tokens = value.split(',').map(token => token.trim()).filter(Boolean);
  if (tokens.length === 0) throw new Error('Indiquez au moins une page.');

  const result: number[] = [];
  for (const token of tokens) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
        throw new Error(`Les pages doivent être comprises entre 1 et ${pageCount}.`);
      }
      const step = start <= end ? 1 : -1;
      for (let page = start; page !== end + step; page += step) result.push(page - 1);
      continue;
    }

    const page = Number(token);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(`Page invalide : ${token}. Utilisez des numéros entre 1 et ${pageCount}.`);
    }
    result.push(page - 1);
  }
  return result;
}

export async function organizePdf(file: File, selection: string): Promise<PdfOutput> {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();
  if (pageCount === 0) throw new Error('Ce PDF ne contient aucune page.');

  const indices = parsePageSelection(selection, pageCount);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, indices);
  pages.forEach(page => output.addPage(page));
  const bytes = await output.save();

  return {
    name: `${file.name.replace(/\.pdf$/i, '')}-organise.pdf`,
    url: bytesToPdfUrl(bytes),
  };
}
