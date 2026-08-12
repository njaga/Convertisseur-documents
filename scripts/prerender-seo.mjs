import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const siteUrl = 'https://convertisseur-documents.vercel.app';
const imageUrl = `${siteUrl}/api/og-image`;

const routes = [
  ['modifier-pdf', 'Modifier un PDF en ligne gratuitement | Doxali', 'Ajoutez du texte, des images, signatures, annotations et dessins sur vos PDF, puis réorganisez les pages directement dans Doxali.'],
  ['fusionner-pdf', 'Fusionner des PDF en ligne gratuitement | Doxali', 'Assemblez plusieurs fichiers PDF dans l’ordre exact de votre choix, simplement et sans inscription.'],
  ['diviser-pdf', 'Diviser un PDF en ligne gratuitement | Doxali', 'Séparez rapidement les pages d’un PDF et récupérez uniquement les parties dont vous avez besoin.'],
  ['compresser-pdf', 'Compresser un PDF en ligne gratuitement | Doxali', 'Réduisez le poids de vos fichiers PDF avec plusieurs niveaux de qualité, directement depuis Doxali.'],
  ['signer-pdf', 'Signer un PDF en ligne gratuitement | Doxali', 'Ajoutez une signature ou un cachet, déplacez-le et redimensionnez-le visuellement avant de télécharger votre PDF.'],
  ['formulaires-pdf', 'Remplir et créer des formulaires PDF | Doxali', 'Remplissez les champs d’un formulaire PDF existant ou créez vos propres champs interactifs.'],
  ['organiser-pdf', 'Organiser les pages d’un PDF gratuitement | Doxali', 'Réordonnez vos pages PDF par glisser-déposer et choisissez précisément l’ordre du document final.'],
  ['pivoter-pdf', 'Pivoter les pages d’un PDF gratuitement | Doxali', 'Tournez rapidement les pages de votre PDF à 90°, 180° ou 270°.'],
  ['pdf-en-png', 'Convertir un PDF en PNG gratuitement | Doxali', 'Transformez les pages de votre PDF en images PNG de qualité, directement dans votre navigateur.'],
  ['images-en-pdf', 'Convertir des images en PDF gratuitement | Doxali', 'Créez un PDF à partir de vos images JPG, PNG ou WebP, avec aperçu et réorganisation visuelle.'],
  ['convertir', 'Convertir des fichiers en ligne gratuitement | Doxali', 'Convertissez images, vidéos, audio, texte et formats compatibles simplement, sans inscription.'],
  ['optimiser-images', 'Compresser et optimiser des images | Doxali', 'Compressez, redimensionnez, recadrez et convertissez vos images directement dans votre navigateur.'],
  ['compresser-video', 'Compresser une vidéo en ligne | Doxali', 'Réduisez le poids d’une vidéo avant partage ou stockage grâce aux outils d’optimisation Doxali.'],
  ['ocr-pdf', 'OCR PDF et images en ligne gratuitement | Doxali', 'Extrayez le texte de vos PDF et images pour le copier, le corriger ou le réutiliser.'],
  ['creer-pdf', 'Créer un PDF en ligne gratuitement | Doxali', 'Créez rapidement un document PDF propre avec texte, logo et pied de page.'],
  ['batch', 'Convertir plusieurs fichiers par lot | Doxali', 'Traitez plusieurs fichiers à la suite puis récupérez facilement tous vos résultats.'],
  ['formats', 'Formats de fichiers pris en charge | Doxali', 'Consultez les formats réellement pris en charge par Doxali pour les images, vidéos, audio, texte, documents Office et outils PDF.'],
  ['conditions', 'Conditions d’utilisation | Doxali', 'Consultez les conditions d’utilisation de Doxali, son approche local-first, le traitement des fichiers et les limites du service.'],
  ['a-propos', 'À propos de Doxali', 'Découvrez Doxali, une suite simple d’outils PDF et documentaires pensée pour travailler sans parcours compliqué.'],
  ['brouillons', 'Brouillons locaux | Doxali', 'Retrouvez les brouillons enregistrés localement dans ce navigateur.', 'noindex,follow'],
  ['historique', 'Historique local | Doxali', 'Retrouvez les derniers fichiers traités localement dans ce navigateur.', 'noindex,follow'],
  ['documents', 'Outils documents | Doxali', 'Accédez aux outils documentaires Doxali.', 'noindex,follow'],
  ['pdf', 'Outils PDF | Doxali', 'Accédez aux outils PDF Doxali.', 'noindex,follow'],
  ['optimiser', 'Outils d’optimisation | Doxali', 'Accédez aux outils d’optimisation Doxali.', 'noindex,follow'],
];

const escapeHtml = value => value
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

const renderRoute = (template, slug, title, description, robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1') => {
  const path = `/${slug}`;
  const canonical = `${siteUrl}${path}`;
  const socialTitle = title.replace(' | Doxali', ' — Doxali');
  const alt = `${socialTitle} — outils PDF et documents`;

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceMetaName(html, 'description', description);
  html = replaceMetaName(html, 'robots', robots);
  html = html.replace(/<link(?=[^>]*\brel=["']canonical["'])[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMetaProperty(html, 'og:title', socialTitle);
  html = replaceMetaProperty(html, 'og:description', description);
  html = replaceMetaProperty(html, 'og:url', canonical);
  html = replaceMetaProperty(html, 'og:image', imageUrl);
  html = replaceMetaProperty(html, 'og:image:secure_url', imageUrl);
  html = replaceMetaProperty(html, 'og:image:alt', alt);
  html = replaceMetaName(html, 'twitter:title', title);
  html = replaceMetaName(html, 'twitter:description', description);
  html = replaceMetaName(html, 'twitter:image', imageUrl);
  html = replaceMetaName(html, 'twitter:image:alt', alt);

  const pageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title.replace(' | Doxali', ''),
    description,
    url: canonical,
    inLanguage: 'fr',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Doxali',
      url: `${siteUrl}/`,
    },
  }).replaceAll('<', '\\u003c');

  return html.replace('</head>', `    <script type="application/ld+json" data-prerendered-route>${pageSchema}</script>\n  </head>`);
};

const main = async () => {
  const template = await readFile(join('dist', 'index.html'), 'utf8');
  const outputDir = join('dist', '__prerender');
  await mkdir(outputDir, { recursive: true });

  await Promise.all(routes.map(async ([slug, title, description, robots]) => {
    const html = renderRoute(template, slug, title, description, robots);
    await writeFile(join(outputDir, `${slug}.html`), html, 'utf8');
  }));

  console.log(`Generated ${routes.length} route-specific HTML documents.`);
};

await main();
