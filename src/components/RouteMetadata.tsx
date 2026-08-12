import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import seoConfig from '../seo/pages.json';

type SeoPage = {
  title: string;
  description: string;
  index: boolean;
  schemaType: string;
  canonical?: string;
};

const pages = seoConfig.pages as Record<string, SeoPage>;

const ensureMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const ensureCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
};

const buildStructuredData = (page: SeoPage, canonicalUrl: string) => {
  const base = {
    '@context': 'https://schema.org',
    '@type': page.schemaType,
    name: page.title.replace(/\s*\|\s*Doxali$/, ''),
    description: page.description,
    url: canonicalUrl,
    inLanguage: seoConfig.language,
    isAccessibleForFree: true,
    creator: {
      '@type': 'Person',
      name: seoConfig.author,
    },
  } as Record<string, unknown>;

  if (page.schemaType === 'WebApplication') {
    base.applicationCategory = 'UtilitiesApplication';
    base.operatingSystem = 'Any';
    base.browserRequirements = 'JavaScript et navigateur web moderne';
    base.featureList = [
      'Modifier des PDF',
      'Fusionner et diviser des PDF',
      'Signer des PDF',
      'Compresser des documents',
      'Convertir des fichiers',
      'OCR PDF et images',
    ];
  }

  return base;
};

export default function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const page = pages[location.pathname] ?? {
      title: 'Page introuvable | Doxali',
      description: 'Cette page Doxali est introuvable.',
      index: false,
      schemaType: 'WebPage',
    };

    const canonicalPath = page.canonical ?? location.pathname;
    const canonicalUrl = new URL(canonicalPath, `${seoConfig.siteUrl}/`).href;
    const imageUrl = new URL(seoConfig.ogImage, `${seoConfig.siteUrl}/`).href;
    const robots = page.index
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,follow';

    document.documentElement.lang = seoConfig.language;
    document.title = page.title;

    ensureMeta('name', 'description', page.description);
    ensureMeta('name', 'author', seoConfig.author);
    ensureMeta('name', 'robots', robots);
    ensureMeta('name', 'googlebot', robots);

    ensureMeta('property', 'og:type', 'website');
    ensureMeta('property', 'og:site_name', seoConfig.siteName);
    ensureMeta('property', 'og:locale', seoConfig.locale);
    ensureMeta('property', 'og:title', page.title);
    ensureMeta('property', 'og:description', page.description);
    ensureMeta('property', 'og:url', canonicalUrl);
    ensureMeta('property', 'og:image', imageUrl);
    ensureMeta('property', 'og:image:secure_url', imageUrl);
    ensureMeta('property', 'og:image:type', 'image/png');
    ensureMeta('property', 'og:image:width', '1200');
    ensureMeta('property', 'og:image:height', '630');
    ensureMeta('property', 'og:image:alt', seoConfig.ogImageAlt);

    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:creator', seoConfig.twitterCreator);
    ensureMeta('name', 'twitter:title', page.title);
    ensureMeta('name', 'twitter:description', page.description);
    ensureMeta('name', 'twitter:image', imageUrl);
    ensureMeta('name', 'twitter:image:alt', seoConfig.ogImageAlt);

    ensureCanonical(canonicalUrl);

    let script = document.getElementById('doxali-structured-data') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'doxali-structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildStructuredData(page, canonicalUrl));
  }, [location.pathname]);

  return null;
}
