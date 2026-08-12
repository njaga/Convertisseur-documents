import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'src/seo/pages.json'), 'utf8'));
const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const absoluteUrl = pathname => new URL(pathname, `${config.siteUrl}/`).href;

const replaceTitle = (html, title) => html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);

const replaceMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
};

const replaceCanonical = (html, href) => {
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
};

const replaceStructuredData = (html, json) => {
  const safeJson = JSON.stringify(json).replaceAll('<', '\\u003c');
  const pattern = /<script\s+id=["']doxali-structured-data["'][^>]*>.*?<\/script>/s;
  const tag = `<script id="doxali-structured-data" type="application/ld+json">${safeJson}</script>`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n  </head>`);
};

const structuredDataFor = (page, canonicalUrl) => {
  const data = {
    '@context': 'https://schema.org',
    '@type': page.schemaType,
    name: page.title.replace(/\s*\|\s*Doxali$/, ''),
    description: page.description,
    url: canonicalUrl,
    inLanguage: config.language,
    isAccessibleForFree: true,
    creator: { '@type': 'Person', name: config.author },
  };

  if (page.schemaType === 'WebApplication') {
    data.applicationCategory = 'UtilitiesApplication';
    data.operatingSystem = 'Any';
    data.browserRequirements = 'JavaScript et navigateur web moderne';
  }

  return data;
};

const render = (pathname, page) => {
  const canonicalUrl = absoluteUrl(page.canonical ?? pathname);
  const imageUrl = absoluteUrl(config.ogImage);
  const robots = page.index
    ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    : 'noindex,follow';

  let html = replaceTitle(baseHtml, page.title);
  html = replaceMeta(html, 'name', 'description', page.description);
  html = replaceMeta(html, 'name', 'robots', robots);
  html = replaceMeta(html, 'name', 'googlebot', robots);
  html = replaceCanonical(html, canonicalUrl);
  html = replaceMeta(html, 'property', 'og:title', page.title);
  html = replaceMeta(html, 'property', 'og:description', page.description);
  html = replaceMeta(html, 'property', 'og:url', canonicalUrl);
  html = replaceMeta(html, 'property', 'og:image', imageUrl);
  html = replaceMeta(html, 'property', 'og:image:secure_url', imageUrl);
  html = replaceMeta(html, 'property', 'og:image:alt', config.ogImageAlt);
  html = replaceMeta(html, 'name', 'twitter:title', page.title);
  html = replaceMeta(html, 'name', 'twitter:description', page.description);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
  html = replaceMeta(html, 'name', 'twitter:image:alt', config.ogImageAlt);
  html = replaceStructuredData(html, structuredDataFor(page, canonicalUrl));
  return html;
};

for (const [pathname, page] of Object.entries(config.pages)) {
  const html = render(pathname, page);
  if (pathname === '/') {
    await writeFile(path.join(distDir, 'index.html'), html);
    continue;
  }

  const outputDir = path.join(distDir, pathname.replace(/^\//, ''));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html);
}

const sitemapEntries = Object.entries(config.pages)
  .filter(([, page]) => page.index)
  .map(([pathname, page]) => {
    const loc = absoluteUrl(page.canonical ?? pathname);
    const changefreq = page.changefreq ? `\n    <changefreq>${page.changefreq}</changefreq>` : '';
    const priority = typeof page.priority === 'number' ? `\n    <priority>${page.priority.toFixed(2)}</priority>` : '';
    return `  <url>\n    <loc>${loc}</loc>${changefreq}${priority}\n  </url>`;
  });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`;
await writeFile(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`SEO statique généré pour ${Object.keys(config.pages).length} routes.`);
