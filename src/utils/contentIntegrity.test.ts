import { describe, expect, it } from 'vitest';
import routeMetadata from '../../content/route-metadata.json';
import editorialContent from '../../content/tool-editorial.json';

const toolRoutes = [
  '/fusionner-pdf',
  '/diviser-pdf',
  '/modifier-pdf',
  '/formulaires-pdf',
  '/organiser-pdf',
  '/pivoter-pdf',
  '/pdf-en-png',
  '/images-en-pdf',
  '/compresser-pdf',
  '/signer-pdf',
  '/ocr-pdf',
  '/creer-pdf',
  '/optimiser-images',
  '/compresser-video',
  '/convertir',
  '/batch',
] as const;

const routePaths = new Set(routeMetadata.map(route => route.path));
const editorial = editorialContent as Record<string, {
  heading: string;
  intro: string[];
  steps: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string; description: string }>;
}>;

describe('route metadata', () => {
  it('contains unique paths and non-empty metadata', () => {
    expect(routePaths.size).toBe(routeMetadata.length);

    for (const route of routeMetadata) {
      expect(route.path.startsWith('/')).toBe(true);
      expect(route.title.trim().length).toBeGreaterThan(0);
      expect(route.description.trim().length).toBeGreaterThan(40);
    }
  });
});

describe('tool editorial content', () => {
  it('covers every canonical tool route', () => {
    expect(Object.keys(editorial).sort()).toEqual([...toolRoutes].sort());
  });

  it('keeps editorial routes indexable and internally consistent', () => {
    for (const path of toolRoutes) {
      const route = routeMetadata.find(candidate => candidate.path === path);
      const content = editorial[path];

      expect(route?.index).toBe(true);
      expect(content.heading.trim().length).toBeGreaterThan(0);
      expect(content.intro.length).toBeGreaterThanOrEqual(1);
      expect(content.steps).toHaveLength(3);
      expect(content.faqs).toHaveLength(3);
      expect(content.related).toHaveLength(3);

      for (const item of content.faqs) {
        expect(item.question.endsWith('?')).toBe(true);
        expect(item.answer.trim().length).toBeGreaterThan(20);
      }

      for (const item of content.related) {
        expect(routePaths.has(item.href)).toBe(true);
        expect(item.href).not.toBe(path);
      }
    }
  });
});
