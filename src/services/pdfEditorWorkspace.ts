import { createPdfPagePreviews, type CompositePdfPage } from './pdfTools';
import { clonePdfOverlays, getImageDimensions, getPdfPageDimensions, type PdfOverlay } from './pdfContentEditor';

export interface PdfEditorWorkspacePage extends CompositePdfPage {
  id: string;
  pageNumber: number;
  url: string;
  label: string;
  pageWidth: number;
  pageHeight: number;
  overlays: PdfOverlay[];
}

export interface PdfEditorDraftSource {
  id: string;
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
}

export interface PdfEditorDraftPage {
  id: string;
  kind: CompositePdfPage['kind'];
  sourceId: string;
  sourceIndex: number;
  pageNumber: number;
  rotation: CompositePdfPage['rotation'];
  label: string;
  pageWidth: number;
  pageHeight: number;
  overlays: PdfOverlay[];
}

export interface PdfEditorDraftState {
  version: 1;
  sources: PdfEditorDraftSource[];
  pages: PdfEditorDraftPage[];
}

const sourceKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

export function serializePdfEditorDraft(pages: PdfEditorWorkspacePage[]): PdfEditorDraftState {
  const sourceIds = new Map<string, string>();
  const sources: PdfEditorDraftSource[] = [];

  const draftPages = pages.map(page => {
    const key = sourceKey(page.file);
    let sourceId = sourceIds.get(key);
    if (!sourceId) {
      sourceId = crypto.randomUUID();
      sourceIds.set(key, sourceId);
      sources.push({
        id: sourceId,
        name: page.file.name,
        type: page.file.type,
        lastModified: page.file.lastModified,
        blob: page.file,
      });
    }

    return {
      id: page.id,
      kind: page.kind,
      sourceId,
      sourceIndex: page.sourceIndex,
      pageNumber: page.pageNumber,
      rotation: page.rotation,
      label: page.label,
      pageWidth: page.pageWidth,
      pageHeight: page.pageHeight,
      overlays: clonePdfOverlays(page.overlays),
    } satisfies PdfEditorDraftPage;
  });

  return { version: 1, sources, pages: draftPages };
}

export async function hydratePdfEditorDraft(state: PdfEditorDraftState): Promise<{ pages: PdfEditorWorkspacePage[]; objectUrls: string[] }> {
  if (state.version !== 1) throw new Error('Ce brouillon utilise une version non prise en charge.');

  const files = new Map<string, File>();
  const previews = new Map<string, Array<{ url: string; width: number; height: number }>>();
  const objectUrls: string[] = [];

  for (const source of state.sources) {
    const file = new File([source.blob], source.name, { type: source.type, lastModified: source.lastModified });
    files.set(source.id, file);
    const pagesForSource = state.pages.filter(page => page.sourceId === source.id);
    const kind = pagesForSource[0]?.kind;

    if (kind === 'pdf') {
      const [rendered, dimensions] = await Promise.all([
        createPdfPagePreviews([file], 0.65),
        getPdfPageDimensions(file),
      ]);
      objectUrls.push(...rendered.map(preview => preview.url));
      previews.set(source.id, rendered.map((preview, index) => ({
        url: preview.url,
        width: dimensions[index]?.width ?? pagesForSource.find(page => page.sourceIndex === index)?.pageWidth ?? 595,
        height: dimensions[index]?.height ?? pagesForSource.find(page => page.sourceIndex === index)?.pageHeight ?? 842,
      })));
    } else {
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      const dimensions = await getImageDimensions(file).catch(() => ({
        width: pagesForSource[0]?.pageWidth ?? 1200,
        height: pagesForSource[0]?.pageHeight ?? 1600,
      }));
      previews.set(source.id, [{ url, width: dimensions.width, height: dimensions.height }]);
    }
  }

  const pages = state.pages.map(page => {
    const file = files.get(page.sourceId);
    const preview = previews.get(page.sourceId)?.[page.kind === 'pdf' ? page.sourceIndex : 0];
    if (!file || !preview) throw new Error(`Impossible de restaurer ${page.label}.`);
    return {
      id: page.id,
      kind: page.kind,
      file,
      sourceIndex: page.sourceIndex,
      pageNumber: page.pageNumber,
      rotation: page.rotation,
      url: preview.url,
      label: page.label,
      pageWidth: preview.width || page.pageWidth,
      pageHeight: preview.height || page.pageHeight,
      overlays: clonePdfOverlays(page.overlays),
    } satisfies PdfEditorWorkspacePage;
  });

  return { pages, objectUrls };
}
