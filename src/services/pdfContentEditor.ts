import { degrees, PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { saveHistory } from './history';
import type { CompositePdfPage, PdfOutput } from './pdfTools';

export type PdfPoint = { x: number; y: number };

type OverlayBase = {
  id: string;
  opacity: number;
};

export type PdfTextOverlay = OverlayBase & {
  kind: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
};

export type PdfImageOverlay = OverlayBase & {
  kind: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  file: File;
};

export type PdfRectOverlay = OverlayBase & {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fill: boolean;
  borderWidth: number;
};

export type PdfDrawOverlay = OverlayBase & {
  kind: 'draw';
  points: PdfPoint[];
  color: string;
  thickness: number;
};

export type PdfOverlay = PdfTextOverlay | PdfImageOverlay | PdfRectOverlay | PdfDrawOverlay;
export type PositionedPdfOverlay = Exclude<PdfOverlay, PdfDrawOverlay>;

export interface RichCompositePdfPage extends CompositePdfPage {
  overlays?: PdfOverlay[];
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

function colorFromHex(value: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : '111827';
  return rgb(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  );
}

function pdfBlobFromBytes(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: 'application/pdf' });
}

async function imageAsPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error(`Impossible de préparer ${file.name}.`);
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error(`Impossible de préparer ${file.name}.`)), 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function splitTextLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const result: string[] = [];
  const paragraphs = text.replace(/\r/g, '').split('\n');
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      result.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !line) line = candidate;
      else {
        result.push(line);
        line = word;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

async function drawTextOverlay(document: PDFDocument, page: PDFPage, overlay: PdfTextOverlay) {
  const { width, height } = page.getSize();
  const font = await document.embedFont(overlay.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  const fontSize = clamp(overlay.fontSize, 6, 96);
  const maxWidth = width * clamp(overlay.width, 1, 100) / 100;
  const boxHeight = height * clamp(overlay.height, 1, 100) / 100;
  const startX = width * clamp(overlay.x, 0, 100) / 100;
  const startTop = height * clamp(overlay.y, 0, 100) / 100;
  const lineHeight = fontSize * 1.2;
  const lines = splitTextLines(overlay.text, font, fontSize, maxWidth);
  const maxLines = Math.max(1, Math.floor(boxHeight / lineHeight));

  lines.slice(0, maxLines).forEach((line, index) => {
    const measured = font.widthOfTextAtSize(line, fontSize);
    const offset = overlay.align === 'center' ? Math.max(0, (maxWidth - measured) / 2) : overlay.align === 'right' ? Math.max(0, maxWidth - measured) : 0;
    page.drawText(line, {
      x: startX + offset,
      y: height - startTop - fontSize - index * lineHeight,
      size: fontSize,
      font,
      color: colorFromHex(overlay.color),
      opacity: clamp(overlay.opacity, 0, 1),
      maxWidth,
    });
  });
}

async function drawImageOverlay(document: PDFDocument, page: PDFPage, overlay: PdfImageOverlay, imageCache: Map<File, Uint8Array>) {
  const { width, height } = page.getSize();
  let bytes = imageCache.get(overlay.file);
  if (!bytes) {
    bytes = await imageAsPngBytes(overlay.file);
    imageCache.set(overlay.file, bytes);
  }
  const image = await document.embedPng(bytes);
  const boxWidth = width * clamp(overlay.width, 1, 100) / 100;
  const boxHeight = height * clamp(overlay.height, 1, 100) / 100;
  const x = width * clamp(overlay.x, 0, 100) / 100;
  const top = height * clamp(overlay.y, 0, 100) / 100;
  page.drawImage(image, {
    x,
    y: height - top - boxHeight,
    width: boxWidth,
    height: boxHeight,
    opacity: clamp(overlay.opacity, 0, 1),
  });
}

function drawRectOverlay(page: PDFPage, overlay: PdfRectOverlay) {
  const { width, height } = page.getSize();
  const boxWidth = width * clamp(overlay.width, 1, 100) / 100;
  const boxHeight = height * clamp(overlay.height, 1, 100) / 100;
  const x = width * clamp(overlay.x, 0, 100) / 100;
  const top = height * clamp(overlay.y, 0, 100) / 100;
  const color = colorFromHex(overlay.color);
  page.drawRectangle({
    x,
    y: height - top - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: overlay.fill ? color : undefined,
    opacity: overlay.fill ? clamp(overlay.opacity, 0, 1) : undefined,
    borderColor: overlay.fill ? undefined : color,
    borderOpacity: overlay.fill ? undefined : clamp(overlay.opacity, 0, 1),
    borderWidth: overlay.fill ? 0 : clamp(overlay.borderWidth, 0.5, 16),
  });
}

function drawFreehandOverlay(page: PDFPage, overlay: PdfDrawOverlay) {
  if (overlay.points.length < 2) return;
  const { width, height } = page.getSize();
  for (let index = 1; index < overlay.points.length; index += 1) {
    const previous = overlay.points[index - 1];
    const current = overlay.points[index];
    page.drawLine({
      start: { x: width * previous.x / 100, y: height * (1 - previous.y / 100) },
      end: { x: width * current.x / 100, y: height * (1 - current.y / 100) },
      thickness: clamp(overlay.thickness, 0.5, 24),
      color: colorFromHex(overlay.color),
      opacity: clamp(overlay.opacity, 0, 1),
    });
  }
}

async function drawOverlays(document: PDFDocument, page: PDFPage, overlays: PdfOverlay[], imageCache: Map<File, Uint8Array>) {
  for (const overlay of overlays) {
    if (overlay.kind === 'text') await drawTextOverlay(document, page, overlay);
    else if (overlay.kind === 'image') await drawImageOverlay(document, page, overlay, imageCache);
    else if (overlay.kind === 'rect') drawRectOverlay(page, overlay);
    else drawFreehandOverlay(page, overlay);
  }
}

export async function getPdfPageDimensions(file: File): Promise<Array<{ width: number; height: number }>> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  return document.getPages().map(page => page.getSize());
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export function clonePdfOverlays(overlays: PdfOverlay[], regenerateIds = false): PdfOverlay[] {
  return overlays.map(overlay => overlay.kind === 'draw'
    ? { ...overlay, id: regenerateIds ? crypto.randomUUID() : overlay.id, points: overlay.points.map(point => ({ ...point })) }
    : { ...overlay, id: regenerateIds ? crypto.randomUUID() : overlay.id });
}

export async function buildRichCompositePdf(pages: RichCompositePdfPage[], name = 'document-modifie.pdf'): Promise<PdfOutput> {
  if (!pages.length) throw new Error('Le document final doit contenir au moins une page.');
  const output = await PDFDocument.create();
  const pdfCache = new Map<File, PDFDocument>();
  const imageCache = new Map<File, Uint8Array>();

  for (const item of pages) {
    if (item.kind === 'image') {
      let pngBytes = imageCache.get(item.file);
      if (!pngBytes) {
        pngBytes = await imageAsPngBytes(item.file);
        imageCache.set(item.file, pngBytes);
      }
      const image = await output.embedPng(pngBytes);
      const natural = image.scale(1);
      const page = output.addPage([natural.width, natural.height]);
      page.drawImage(image, { x: 0, y: 0, width: natural.width, height: natural.height });
      await drawOverlays(output, page, item.overlays ?? [], imageCache);
      page.setRotation(degrees(item.rotation));
      continue;
    }

    let source = pdfCache.get(item.file);
    if (!source) {
      source = await PDFDocument.load(await item.file.arrayBuffer());
      pdfCache.set(item.file, source);
    }
    if (item.sourceIndex < 0 || item.sourceIndex >= source.getPageCount()) throw new Error(`Page invalide dans ${item.file.name}.`);
    const [page] = await output.copyPages(source, [item.sourceIndex]);
    const currentRotation = page.getRotation().angle;
    await drawOverlays(output, page, item.overlays ?? [], imageCache);
    page.setRotation(degrees((currentRotation + item.rotation) % 360));
    output.addPage(page);
  }

  const bytes = await output.save();
  const blob = pdfBlobFromBytes(bytes);
  await saveHistory(name, 'Modification PDF', blob).catch(() => undefined);
  return { name, url: URL.createObjectURL(blob) };
}
