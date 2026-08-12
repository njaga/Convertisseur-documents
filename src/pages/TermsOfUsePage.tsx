import { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  HardDrive,
  Mail,
  Scale,
  Server,
  ShieldCheck,
} from 'lucide-react';

const sections = [
  {
    number: '01',
    title: 'Accès au service',
    paragraphs: [
      'Doxali est une suite d’outils documentaires accessible sans création de compte. Le service peut évoluer, être interrompu temporairement ou voir certaines fonctions modifiées pour des raisons techniques, de sécurité ou de maintenance.',
      'L’utilisation personnelle et professionnelle est autorisée, sous réserve de respecter la loi et les présentes conditions.',
    ],
  },
  {
    number: '02',
    title: 'Confidentialité et traitement des fichiers',
    paragraphs: [
      'Doxali suit une approche local-first : les conversions d’images, d’audio, de vidéo, de texte ainsi que les principaux outils PDF sont exécutés dans votre navigateur lorsque cela est techniquement possible.',
      'La conversion Office vers PDF est différente : lorsqu’un moteur Office est activé sur le déploiement, le document est transmis au service de conversion pour être traité. Le service est conçu pour supprimer ses fichiers temporaires après la requête. Si ce moteur n’est pas configuré, les formats Office ne sont pas proposés.',
      'Les brouillons et l’historique disponibles dans l’application sont stockés localement dans votre navigateur. Ils ne constituent pas une sauvegarde cloud et peuvent disparaître si vous effacez les données du site ou changez d’appareil.',
    ],
  },
  {
    number: '03',
    title: 'Utilisation responsable',
    paragraphs: [
      'Vous restez responsable des fichiers que vous importez ou traitez avec Doxali. Vous devez disposer des droits nécessaires sur leur contenu et ne pas utiliser le service pour traiter, créer ou diffuser des contenus illicites.',
      'Il est interdit de tenter de contourner les mécanismes de sécurité, de perturber volontairement le service, de surcharger les éventuels services serveur ou d’utiliser Doxali pour une activité frauduleuse.',
    ],
  },
  {
    number: '04',
    title: 'Résultats, sauvegardes et responsabilité',
    paragraphs: [
      'Doxali est fourni en l’état. Même si les traitements sont testés, aucune compatibilité absolue ne peut être garantie pour tous les fichiers, navigateurs, appareils ou documents endommagés.',
      'Conservez toujours une copie de vos documents d’origine et vérifiez le fichier généré avant de supprimer une source, de signer un document important ou de l’utiliser dans un contexte professionnel, administratif ou juridique.',
      'Les performances dépendent notamment de la mémoire disponible, de la puissance de l’appareil, du navigateur et de la taille du fichier. Les gros PDF et les traitements FFmpeg peuvent être particulièrement exigeants sur mobile.',
    ],
  },
  {
    number: '05',
    title: 'Évolution de Doxali',
    paragraphs: [
      'Les formats pris en charge, les limites techniques, l’interface et les présentes conditions peuvent évoluer à mesure que Doxali s’améliore. La date de mise à jour affichée sur cette page permet d’identifier la version applicable.',
      'Une fonctionnalité indiquée comme locale peut être remplacée ou complétée par un traitement serveur uniquement si cela devient nécessaire au fonctionnement du produit ; la documentation et l’interface devront alors l’indiquer clairement.',
    ],
  },
];

const TermsOfUsePage = () => {
  useEffect(() => {
    const title = 'Conditions d’utilisation | Doxali';
    const description = 'Consultez les conditions d’utilisation de Doxali, son approche local-first, le traitement des fichiers et les limites du service.';
    const canonicalUrl = 'https://convertisseur-documents.vercel.app/conditions';

    const setNamedMeta = (name: string, content: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!node) {
        node = document.createElement('meta');
        node.name = name;
        document.head.appendChild(node);
      }
      node.content = content;
    };

    const setPropertyMeta = (property: string, content: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute('property', property);
        document.head.appendChild(node);
      }
      node.content = content;
    };

    document.title = title;
    setNamedMeta('description', description);
    setNamedMeta('robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setNamedMeta('twitter:title', title);
    setNamedMeta('twitter:description', description);
    setPropertyMeta('og:title', 'Conditions d’utilisation — Doxali');
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', canonicalUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-28 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-[#2457E6]">Conditions d’utilisation</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Mise à jour : 12 août 2026</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Des règles simples pour un outil simple.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Cette page explique comment Doxali fonctionne, ce qui reste sur votre appareil et les responsabilités à garder en tête lorsque vous traitez vos documents.
          </p>
        </header>

        <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <div className="bg-white p-5">
            <CheckCircle2 size={20} className="text-[#2457E6]" />
            <p className="mt-3 text-sm font-semibold">Sans compte</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Les outils principaux sont accessibles sans créer de profil utilisateur.</p>
          </div>
          <div className="bg-white p-5">
            <ShieldCheck size={20} className="text-[#2457E6]" />
            <p className="mt-3 text-sm font-semibold">Local-first</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Les traitements restent dans le navigateur chaque fois qu’un moteur local fiable est disponible.</p>
          </div>
          <div className="bg-white p-5">
            <HardDrive size={20} className="text-[#2457E6]" />
            <p className="mt-3 text-sm font-semibold">Stockage local</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Brouillons et historique sont liés à ce navigateur, pas à un compte cloud.</p>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-10">
            {sections.map(section => (
              <section key={section.number} className="border-t border-slate-200 pt-6">
                <div className="grid gap-4 sm:grid-cols-[54px_1fr]">
                  <span className="text-xs font-bold tracking-[0.12em] text-slate-400">{section.number}</span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-lg border border-slate-200 p-5">
              <Server size={19} className="text-[#2457E6]" />
              <h2 className="mt-3 text-sm font-semibold">Cas particulier : Office</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                DOC, DOCX, XLS, XLSX, PPT, PPTX et formats OpenDocument peuvent nécessiter un moteur serveur. L’interface ne les propose que lorsqu’il est configuré.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-5">
              <AlertTriangle size={19} className="text-amber-700" />
              <h2 className="mt-3 text-sm font-semibold text-slate-900">Documents sensibles</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pour un document confidentiel ou critique, vérifiez toujours le type de traitement indiqué dans l’outil avant de continuer.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <Scale size={19} className="text-slate-600" />
              <h2 className="mt-3 text-sm font-semibold">Portée de cette page</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ces conditions décrivent l’usage de Doxali et son fonctionnement actuel. Elles ne constituent pas un conseil juridique adapté à une situation particulière.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="max-w-2xl">
              <Mail size={20} className="text-[#2457E6]" />
              <h2 className="mt-3 text-xl font-bold">Une question sur Doxali ?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Pour signaler un problème, demander une précision ou discuter du traitement des fichiers, vous pouvez contacter le développeur du projet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="mailto:contact@ndiagandiaye.com" className="inline-flex items-center gap-2 rounded-md bg-[#2457E6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d48c7]">
                Contact <ArrowUpRight size={14} />
              </a>
              <a href="https://github.com/njaga/Convertisseur-documents" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Code source <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TermsOfUsePage;
