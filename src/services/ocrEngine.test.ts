import { describe, expect, it } from 'vitest';
import { normalizeOcrLanguages } from './ocrEngine';

describe('normalizeOcrLanguages', () => {
  it('maps common French and English aliases to Tesseract language codes', () => {
    expect(normalizeOcrLanguages(['fr', 'en'])).toEqual(['fra', 'eng']);
  });

  it('deduplicates languages and keeps explicit trained-data codes', () => {
    expect(normalizeOcrLanguages(['fra', 'FR', 'eng'])).toEqual(['fra', 'eng']);
  });

  it('uses French and English when no language is configured', () => {
    expect(normalizeOcrLanguages([])).toEqual(['fra', 'eng']);
  });
});
