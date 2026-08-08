import { degrees, PDFDocument } from 'pdf-lib';

export interface PdfOutput {
  name: string;
  url: string;
}

function bytesToPdfUrl(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return URL.createObjectURL(new Blob([copy.buffer], { type: 'application/pdf' }));
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
