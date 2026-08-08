import { describe, expect, it } from 'vitest';
import { parsePageSelection } from './pdfTools';

describe('parsePageSelection', () => {
  it('supports individual pages and ranges', () => {
    expect(parsePageSelection('1,3,5-7', 10)).toEqual([0, 2, 4, 5, 6]);
  });

  it('supports reverse ranges for explicit reordering', () => {
    expect(parsePageSelection('4-2,1', 4)).toEqual([3, 2, 1, 0]);
  });

  it('preserves repeated pages when intentionally requested', () => {
    expect(parsePageSelection('1,1,2', 3)).toEqual([0, 0, 1]);
  });

  it('rejects pages outside the document', () => {
    expect(() => parsePageSelection('1,6', 5)).toThrow(/1 et 5/);
    expect(() => parsePageSelection('0', 5)).toThrow();
  });
});
