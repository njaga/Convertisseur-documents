export type OcrProgress = {
  status: 'loading-engine' | 'loading-language' | 'recognizing' | 'page-complete';
  progress: number;
  page?: number;
  pageCount?: number;
};
