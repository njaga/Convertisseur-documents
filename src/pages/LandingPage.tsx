import { Link } from 'react-router-dom';
import { ArrowRight, FileArchive, FileImage, FileSignature, FileText, Files, FormInput, History, Image, Infinity as InfinityIcon, Layers3, Merge, PencilLine, RotateCw, ScanText, Scissors, ShieldCheck, UserRoundX, Video } from 'lucide-react';

const popularTools = [
  { to: '/fusionner-pdf', title: 'Fusionner PDF', description: 'Combinez plusieurs fichiers PDF dans l’ordre de votre choix.', icon: Merge, iconClass: 'bg-orange-50 text-orange-600' },
  { to: '/diviser-pdf', title: 'Diviser PDF', description: 'Séparez rapidement les pages d’un document PDF.', icon: Scissors, iconClass: 'bg-rose-50 text-rose-600' },
  { to: '/compresser-pdf', title: 'Compresser PDF', description: 'Réduisez le poids d’un PDF avec trois niveaux de qualité.', icon: FileArchive, iconClass: 'bg-emerald-50 text-emerald-600' },
  { to: '/convertir', title: 'Convertir un fichier', description: 'Images, vidéos, audio et texte : choisissez le format de sortie.', icon: Files, iconClass: 'bg-blue-50 text-blue-600' },
];

const pdfTools = [
  { to: '/signer-pdf', title: 'Signer PDF', description: 'Placez visuellement une signature ou un cachet sur votre document.', icon: FileSignature, iconClass: 'bg-blue-50 text-blue-600' },
  { to: '/modifier-pdf', title: 'Modifier PDF', description: 'Ajoutez texte, images, signatures, annotations et dessins, puis organisez les pages.', icon: PencilLine, iconClass: 'bg-violet-50 text-violet-600' },
  { to: '/formulaires-pdf', title: 'Formulaires PDF', description: 'Remplissez les champs existants ou créez vos propres champs interactifs.', icon: FormInput, iconClass: 'bg-teal-50 text-teal-700' },
  { to: '/organiser-pdf', title: 'Organiser PDF', description: 'Choisir précisément les pages et leur ordre final.', icon: Layers3, iconClass: 'bg-indigo-50 text-indigo-600' },
  { to: '/pivoter-pdf', title: 'Faire pivoter PDF', description: 'Tourner les pages à 90°, 180° ou 270°.', icon: RotateCw, iconClass: 'bg-fuchsia-50 text-fuchsia-600' },
  { to: '/pdf-en-png', title: 'PDF en PNG', description: 'Convertir chaque page du PDF en image PNG.', icon: FileImage, iconClass: 'bg-amber-50 text-amber-600' },
  { to: '/images-en-pdf', title: 'Images en PDF', description: 'Créer un PDF à partir de fichiers PNG, JPG ou WebP.', icon: Image, iconClass: 'bg-cyan-50 text-cyan-600' },
];

const moreTools = [
  { to: '/ocr-pdf', title: 'OCR PDF & images', description: 'Extraire le texte d’un document pour le copier ou le corriger.', icon: ScanText, iconClass: 'bg-purple-50 text-purple-600' },
  { to: '/creer-pdf', title: 'Créer un PDF', description: 'Rédiger rapidement un document simple avec logo et pied de page.', icon: FileText, iconClass: 'bg-slate-100 text-slate-700' },
  { to: '/optimiser-images', title: 'Optimiser des images', description: 'Compresser, redimensionner, recadrer et convertir.', icon: Image, iconClass: 'bg-sky-50 text-sky-600' },
  { to: '/compresser-video', title: 'Compresser une vidéo', description: 'Réduire le poids d’une vidéo avant partage ou stockage.', icon: Video, iconClass: 'bg-red-50 text-red-600' },
  { to: '/batch', title: 'Conversions par lot', description: 'Traiter plusieurs fichiers et télécharger les résultats en ZIP.', icon: Layers3, iconClass: 'bg-lime-50 text-lime-700' },
  { to: '/historique', title: 'Historique local', description: 'Retrouver les derniers fichiers traités sur cet appareil.', icon: History, iconClass: 'bg-gray-100 text-gray-700' },
];

type ToolCardItem = typeof popularTools[number];

function ToolCard({ tool }: { tool: ToolCardItem }) {
  return (
    <Link to={tool.to} className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${tool.iconClass}`}><tool.icon size={21} strokeWidth={1.9} /></div>
      <h3 className="text-base font-semibold text-gray-950">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{tool.description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 transition-colors group-hover:text-blue-600">Ouvrir <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className="flex-grow bg-[#f7f8fb] pt-16 text-gray-950">
      <section className="border-b border-gray-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Doxali · boîte à outils documentaire</p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-6xl">Tous les outils essentiels pour vos documents, au même endroit.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">Fusionnez, divisez, compressez, convertissez, signez, remplissez et modifiez vos fichiers sans parcours compliqué. Choisissez simplement ce que vous voulez faire.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> Traitement local en priorité</span>
            <span className="inline-flex items-center gap-2"><UserRoundX size={16} className="text-blue-600" /> Sans compte</span>
            <span className="inline-flex items-center gap-2"><InfinityIcon size={17} className="text-violet-600" /> Sans quota quotidien</span>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Accès rapide</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Les outils les plus utilisés</h2></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularTools.map(tool => <ToolCard key={tool.to} tool={tool} />)}
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto max-w-7xl rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">PDF</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Organiser, signer, remplir et éditer vos PDF</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pdfTools.map(tool => <ToolCard key={tool.to} tool={tool} />)}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Plus d’outils</p><h2 className="mt-1 text-2xl font-bold tracking-tight">OCR, création et optimisation</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreTools.map(tool => <ToolCard key={tool.to} tool={tool} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
