export interface PdfAnnotationState {
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  blackout: boolean;
  signatureX: number;
  signatureY: number;
  signatureWidth: number;
}
