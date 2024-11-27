interface SEOProps {
  title: string;
  description: string;
  path: string;
}

export const pageSEO: Record<string, SEOProps> = {
  home: {
    title: "Convertisseur de Fichiers Gratuit | PDF, Images, Vidéos, Audio",
    description: "Convertissez gratuitement vos fichiers en ligne. Plus de 50 formats supportés. Sans inscription, rapide et sécurisé.",
    path: "/"
  },
  formats: {
    title: "Formats Supportés | Convertisseur de Fichiers Gratuit",
    description: "Découvrez tous les formats de fichiers supportés par notre convertisseur : PDF, DOCX, JPG, PNG, MP4, MP3 et plus encore.",
    path: "/formats"
  },
  about: {
    title: "À Propos | Convertisseur de Fichiers Gratuit",
    description: "Découvrez notre outil de conversion de fichiers gratuit. Simple, rapide et sécurisé.",
    path: "/about"
  },
  contact: {
    title: "Contact | Convertisseur de Fichiers Gratuit",
    description: "Une question ? Un problème ? Contactez-nous pour toute aide concernant la conversion de vos fichiers.",
    path: "/contact"
  }
};
