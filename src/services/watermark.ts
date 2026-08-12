import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PdfOutput } from './pdfTools';
import { parsePageSelection } from './pdfTools';

export type WatermarkMode = 'text' | 'image';
export type WatermarkScope = 'all' | 'first' | 'custom';

export interface WatermarkOptions {
  mode: WatermarkMode;
  text: string;
  image?: File;
  opacity: number;
  rotation: number;
  size: number;
  tiled: boolean;
  scope: WatermarkScope;
  pages: string;
  color: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function bytesToPdfUrl(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return URL.createObjectURL(new Blob([copy.buffer], { type: 'application/pdf' }));
}

function parseHexColor(value: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  const hex = match?.[1] ?? '6b7280';
  return rgb(
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  );
}

async function imageAsPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Canvas indisponible dans ce navigateur.');
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => {
      if (value) resolve(value);
      else reject(new Error('Impossible de préparer l’image du filigrane.'));
    }, 'image/png');
  });

  return new Uint8Array(await blob.arrayBuffer());
}

function rotatedOrigin(centerX: number, centerY: number, width: number, height: number, angle: number) {
  const radians = angle * Math.PI / 180;
  const halfX = width / 2;
  const halfY = height / 2;
  const rotatedHalfX = Math.cos(radians) * halfX - Math.sin(radians) * halfY;
  const rotatedHalfY = Math.sin(radians) * halfX + Math.cos(radians) * halfY;
  return { x: centerX - rotatedHalfX, y: centerY - rotatedHalfY };
}

function watermarkCenters(pageWidth: number, pageHeight: number, tiled: boolean) {
  if (!tiled) return [{ x: pageWidth / 2, y: pageHeight / 2 }];

  return [0.2, 0.5, 0.8].flatMap(y => [0.2, 0.5, 0.8].map(x => ({
    x: pageWidth * x,
    y: pageHeight * y,
  })));
}

function selectedPageIndices(pageCount: number, scope: WatermarkScope, pages: string) {
  if (scope === 'first') return [0];
  if (scope === 'custom') return [...new Set(parsePageSelection(pages, pageCount))];
  return Array.from({ length: pageCount }, (_, index) => index);
}

export async function addWatermarkToPdf(file: File, options: WatermarkOptions): Promise<PdfOutput> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = pdf.getPageCount();
  if (!pageCount) throw new Error('Ce PDF ne contient aucune page.');

  const pageIndices = selectedPageIndices(pageCount, options.scope, options.pages);
  if (!pageIndices.length) throw new Error('Sélectionnez au moins une page pour le filigrane.');

  const opacity = clamp(options.opacity / 100, 0.05, 1);
  const rotation = clamp(options.rotation, -180, 180);
  const size = clamp(options.size, 5, 80);

  if (options.mode === 'text') {
    const text = options.text.trim();
    if (!text) throw new Error('Saisissez le texte du filigrane.');

    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const color = parseHexColor(options.color);

    for (const pageIndex of pageIndices) {
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      let fontSize = Math.max(12, Math.min(width, height) * size / 100);
      let textWidth = font.widthOfTextAtSize(text, fontSize);
      const maxWidth = width * (options.tiled ? 0.34 : 0.8);
      if (textWidth > maxWidth) {
        fontSize *= maxWidth / textWidth;
        textWidth = font.widthOfTextAtSize(text, fontSize);
      }
      const textHeight = fontSize;

      for (const center of watermarkCenters(width, height, options.tiled)) {
        const origin = rotatedOrigin(center.x, center.y, textWidth, textHeight, rotation);
        page.drawText(text, {
          x: origin.x,
          y: origin.y,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(rotation),
        });
      }
    }
  } else {
    if (!options.image) throw new Error('Ajoutez une image pour le filigrane.');
    const embedded = await pdf.embedPng(await imageAsPng(options.image));

    for (const pageIndex of pageIndices) {
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      const imageWidth = width * size / 100;
      const imageHeight = imageWidth * embedded.height / embedded.width;

      for (const center of watermarkCenters(width, height, options.tiled)) {
        const origin = rotatedOrigin(center.x, center.y, imageWidth, imageHeight, rotation);
        page.drawImage(embedded, {
          x: origin.x,
          y: origin.y,
          width: imageWidth,
          height: imageHeight,
          opacity,
          rotate: degrees(rotation),
        });
      }
    }
  }

  const bytes = await pdf.save();
  return {
    name: `${file.name.replace(/\.pdf$/i, '')}-filigrane.pdf`,
    url: bytesToPdfUrl(bytes),
  };
}
