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


export interface PdfPagePreview {
  fileIndex: number;
  pageNumber: number;
  url: string;
}

export async function createPdfPagePreviews(files: File[], scale = 0.45): Promise<PdfPagePreview[]> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const previews: PdfPagePreview[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const loadingTask = getDocument({ data: new Uint8Array(await files[fileIndex].arrayBuffer()) });
    const pdf = await loadingTask.promise;
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
        previews.push({ fileIndex, pageNumber, url: URL.createObjectURL(blob) });
        page.cleanup();
      }
    } finally {
      await loadingTask.destroy();
    }
  }
  return previews;
}


export interface PdfPageEdit {
  sourceIndex: number;
  rotation: 0 | 90 | 180 | 270;
}

export async function buildEditedPdf(file: File, pages: PdfPageEdit[], suffix = 'modifie'): Promise<PdfOutput> {
  if (!pages.length) throw new Error('Le document final doit contenir au moins une page.');
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();
  if (pages.some(page => page.sourceIndex < 0 || page.sourceIndex >= pageCount)) {
    throw new Error('La sélection contient une page invalide.');
  }

  const output = await PDFDocument.create();
  for (const edit of pages) {
    const [page] = await output.copyPages(source, [edit.sourceIndex]);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + edit.rotation) % 360));
    output.addPage(page);
  }

  const bytes = await output.save();
  return {
    name: `${file.name.replace(/\.pdf$/i, '')}-${suffix}.pdf`,
    url: bytesToPdfUrl(bytes),
  };
}


export interface CompositePdfPage {
  kind: 'pdf' | 'image';
  file: File;
  sourceIndex: number;
  rotation: 0 | 90 | 180 | 270;
}

export async function buildCompositePdf(pages: CompositePdfPage[], name = 'document-modifie.pdf'): Promise<PdfOutput> {
  if (!pages.length) throw new Error('Le document final doit contenir au moins une page.');
  const output = await PDFDocument.create();
  const pdfCache = new Map<File, PDFDocument>();

  for (const item of pages) {
    if (item.kind === 'image') {
      const pngBytes = await fileToPngBytes(item.file);
      const image = await output.embedPng(pngBytes);
      const natural = image.scale(1);
      const landscape = item.rotation === 90 || item.rotation === 270;
      const page = output.addPage(landscape ? [natural.height, natural.width] : [natural.width, natural.height]);
      page.drawImage(image, {
        x: landscape ? (natural.height - natural.width) / 2 : 0,
        y: landscape ? (natural.width - natural.height) / 2 : 0,
        width: natural.width,
        height: natural.height,
        rotate: degrees(item.rotation),
      });
      continue;
    }

    let source = pdfCache.get(item.file);
    if (!source) {
      source = await PDFDocument.load(await item.file.arrayBuffer());
      pdfCache.set(item.file, source);
    }
    if (item.sourceIndex < 0 || item.sourceIndex >= source.getPageCount()) {
      throw new Error(`Page invalide dans ${item.file.name}.`);
    }
    const [page] = await output.copyPages(source, [item.sourceIndex]);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + item.rotation) % 360));
    output.addPage(page);
  }

  const bytes = await output.save();
  return { name, url: bytesToPdfUrl(bytes) };
}
