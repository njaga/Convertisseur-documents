import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfPagePreviews, PdfOutput } from './pdfTools';

declare global {
  interface Window {
    TextDetector?: new (options?: { languages?: string[] }) => { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> };
  }
}

function urlFromBytes(bytes: Uint8Array): string {
  return URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
}

async function imageAsPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width; canvas.height = bitmap.height;
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
  const accent = rgb(parseInt(color.slice(0,2),16)/255, parseInt(color.slice(2,4),16)/255, parseInt(color.slice(4,6),16)/255);
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
    if (regular.widthOfTextAtSize(candidate, 11) > size[0] - margin * 2) { lines.push(line); line = word; } else line = candidate;
  }
  if (line) lines.push(line);

  for (const value of lines) {
    if (y < 70) { page = pdf.addPage([...size]); y = size[1] - margin; }
    page.drawText(value, { x: margin, y, size: 11, font: regular, color: rgb(.15,.18,.22) });
    y -= 17;
  }
  if (input.footer) page.drawText(input.footer, { x: margin, y: 30, size: 8, font: regular, color: rgb(.45,.48,.52) });
  const bytes = await pdf.save();
  return { name: `${(input.title || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, url: urlFromBytes(bytes) };
}

export async function annotatePdf(input: { pdf: File; page: number; text?: string; signature?: File; x: number; y: number; width: number; blackout?: boolean }): Promise<PdfOutput> {
  const document = await PDFDocument.load(await input.pdf.arrayBuffer());
  if (input.page < 1 || input.page > document.getPageCount()) throw new Error('Numéro de page invalide.');
  const page = document.getPage(input.page - 1);
  const { width, height } = page.getSize();
  const x = width * input.x / 100;
  const y = height * (1 - input.y / 100);

  if (input.blackout) page.drawRectangle({ x, y: y - 24, width: width * input.width / 100, height: 28, color: rgb(0,0,0) });
  if (input.text) {
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText(input.text, { x, y, size: 12, font, color: rgb(.05,.05,.05), maxWidth: width * input.width / 100 });
  }
  if (input.signature) {
    const signature = await document.embedPng(await imageAsPng(input.signature));
    const scaled = signature.scaleToFit(width * input.width / 100, 100);
    page.drawImage(signature, { x, y: y - scaled.height, width: scaled.width, height: scaled.height });
  }
  const bytes = await document.save();
  return { name: `${input.pdf.name.replace(/\.pdf$/i,'')}-annote.pdf`, url: urlFromBytes(bytes) };
}

async function detectImage(file: Blob, languages: string[]): Promise<string> {
  if (!window.TextDetector) throw new Error('L’OCR local natif n’est pas disponible dans ce navigateur. Utilisez Chrome/Edge récent ou l’extraction de texte PDF.');
  const detector = new window.TextDetector({ languages });
  const bitmap = await createImageBitmap(file);
  try { return (await detector.detect(bitmap)).map(item => item.rawValue).join('\n'); }
  finally { bitmap.close(); }
}

export async function runLocalOcr(file: File, languages: string[]): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const previews = await createPdfPagePreviews([file], 1.5);
    try {
      const pages = [];
      for (const preview of previews) pages.push(await detectImage(await fetch(preview.url).then(response => response.blob()), languages));
      return pages.map((text, index) => `--- Page ${index + 1} ---\n${text}`).join('\n\n');
    } finally { previews.forEach(preview => URL.revokeObjectURL(preview.url)); }
  }
  return detectImage(file, languages);
}
