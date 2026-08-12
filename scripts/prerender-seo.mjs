import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE_URL = 'https://convertisseur-documents.vercel.app';
const OG_IMAGE_URL = `${SITE_URL}/api/og-image`;
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceMetaName = (html, name, content) => {
  const pattern = new RegExp(`<meta(?=[^>]*\\bname=["']${escapeRegExp(name)}["'])[^>]*>`, 'i');
  return html.replace(pattern, `<meta name="${name}" content="${escapeHtml(content)}" />`);
};

const replaceMetaProperty = (html, property, content) => {
  const pattern = new RegExp(`<meta(?=[^>]*\\bproperty=["']${escapeRegExp(property)}["'])[^>]*>`, 'i');
  return html.replace(pattern, `<meta property="${property}" content="${escapeHtml(content)}" />`);
};

const routeSlug = path => path.replace(/^\//, '');
const canonicalUrl = path => `${SITE_URL}${path === '/' ? '/' : path}`;

function schemaScript(payload, attribute) {
  const json = JSON.stringify(payload).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json" ${attribute}>${json}</script>`;
}

function renderRoute(template, route, editorial) {
  const canonical = canonicalUrl(route.path);
  const socialTitle = route.title.replace(' | Doxali', ' — Doxali');
  const imageAlt = `${socialTitle} — outils PDF et documents`;
  const robots = route.index ? INDEX_ROBOTS : 'noindex,follow';

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = replaceMetaName(html, 'description', route.description);
  html = replaceMetaName(html, 'robots', robots);
  html = html.replace(
    /<link(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = replaceMetaProperty(html, 'og:title', socialTitle);
  html = replaceMetaProperty(html, 'og:description', route.description);
  html = replaceMetaProperty(html, 'og:url', canonical);
  html = replaceMetaProperty(html, 'og:image', OG_IMAGE_URL);
  html = replaceMetaProperty(html, 'og:image:secure_url', OG_IMAGE_URL);
  html = replaceMetaProperty(html, 'og:image:alt', imageAlt);
  html = replaceMetaName(html, 'twitter:title', route.title);
  html = replaceMetaName(html, 'twitter:description', route.description);
  html = replaceMetaName(html, 'twitter:image', OG_IMAGE_URL);
  html = replaceMetaName(html, 'twitter:image:alt', imageAlt);

  const schemas = [
    schemaScript({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: route.title.replace(' | Doxali', ''),
      description: route.description,
      url: canonical,
      inLanguage: 'fr',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Doxali',
        url: `${SITE_URL}/`,
      },
    }, 'data-prerendered-route'),
  ];

  const faqItems = editorial[route.path]?.faqs ?? [];
  if (route.index && faqItems.length > 0) {
    schemas.push(schemaScript({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }, 'data-prerendered-faq'));
  }

  return html.replace('</head>', `    ${schemas.join('\n    ')}\n  </head>`);
}

function renderSitemap(routes) {
  const urls = routes
    .filter(route => route.index)
    .map(route => `  <url><loc>${escapeHtml(canonicalUrl(route.path))}</loc></url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const main = async () => {
  const [template, routeSource, editorialSource] = await Promise.all([
    readFile(join('dist', 'index.html'), 'utf8'),
    readFile(join('content', 'route-metadata.json'), 'utf8'),
    readFile(join('content', 'tool-editorial.json'), 'utf8'),
  ]);

  const routes = JSON.parse(routeSource);
  const editorial = JSON.parse(editorialSource);
  const outputDir = join('dist', '__prerender');
  await mkdir(outputDir, { recursive: true });

  await Promise.all(routes
    .filter(route => route.path !== '/')
    .map(async route => {
      const html = renderRoute(template, route, editorial);
      await writeFile(join(outputDir, `${routeSlug(route.path)}.html`), html, 'utf8');
    }));

  await writeFile(join('dist', 'sitemap.xml'), renderSitemap(routes), 'utf8');
  console.log(`Generated ${routes.length - 1} route documents and sitemap.xml.`);
};

await main();
