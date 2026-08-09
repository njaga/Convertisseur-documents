import { describe, expect, it } from 'vitest';
import {
  conversionMatrix,
  getAvailableOutputFormats,
  getFileTypeFromExtension,
  isConversionSupported,
} from './formats';

describe('conversionMatrix', () => {
  it('only exposes source-aware conversion pairs', () => {
    expect(getAvailableOutputFormats('pdf')).toEqual([]);
    expect(getAvailableOutputFormats('png').map(format => format.extension)).toEqual(['jpg', 'jpeg', 'webp', 'ico']);
    expect(getAvailableOutputFormats('ico').map(format => format.extension)).toEqual(['png', 'jpg', 'jpeg', 'webp']);
    expect(getAvailableOutputFormats('txt').map(format => format.extension)).toEqual(['html', 'md']);
  });

  it('does not contain identity conversions', () => {
    for (const [source, outputs] of Object.entries(conversionMatrix)) {
      expect(outputs).not.toContain(source);
    }
  });

  it('keeps the public format helper aligned with the registry', () => {
    for (const [source, outputs] of Object.entries(conversionMatrix)) {
      expect(getAvailableOutputFormats(source).map(format => format.extension)).toEqual(outputs);
    }
  });

  it('answers support checks consistently', () => {
    expect(isConversionSupported('png', 'webp')).toBe(true);
    expect(isConversionSupported('png', 'ico')).toBe(true);
    expect(isConversionSupported('ico', 'png')).toBe(true);
    expect(isConversionSupported('pdf', 'xlsx')).toBe(false);
    expect(isConversionSupported('md', 'html')).toBe(true);
    expect(isConversionSupported('mp3', 'png')).toBe(false);
  });
});

describe('getFileTypeFromExtension', () => {
  it('detects supported file families', () => {
    expect(getFileTypeFromExtension('PNG')).toBe('image');
    expect(getFileTypeFromExtension('ICO')).toBe('image');
    expect(getFileTypeFromExtension('mp4')).toBe('video');
    expect(getFileTypeFromExtension('FLAC')).toBe('audio');
    expect(getFileTypeFromExtension('md')).toBe('document');
  });

  it('returns null instead of guessing unsupported files', () => {
    expect(getFileTypeFromExtension('pdf')).toBeNull();
    expect(getFileTypeFromExtension('exe')).toBeNull();
    expect(getFileTypeFromExtension('')).toBeNull();
  });
});
