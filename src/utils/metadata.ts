export const siteMetadata = {
  name: 'Doxali',
  title: 'Doxali — Outils PDF & documents gratuits, sans compte',
  description: 'Modifiez, fusionnez, compressez, signez, convertissez et analysez vos PDF et documents avec Doxali, sans compte et sans quota quotidien.',
  keywords: 'outils PDF, modifier PDF, fusionner PDF, compresser PDF, signer PDF, convertir fichiers, OCR PDF, images en PDF, formulaire PDF',
  author: 'Doxali',
  siteUrl: 'https://convertisseur-documents.vercel.app',
  ogImage: '/og-image.png',
  locale: 'fr_FR',
  themeColor: '#2457E6',
} as const;

export const absoluteUrl = (path = '/') => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteMetadata.siteUrl}${normalized}`;
};
