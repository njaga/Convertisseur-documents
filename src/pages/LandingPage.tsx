import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileArchive,
  FileImage,
  FileSignature,
  FileText,
  Files,
  FormInput,
  History,
  Image,
  Infinity as InfinityIcon,
  Layers3,
  Merge,
  PencilLine,
  RotateCw,
  ScanText,
  Scissors,
  Search,
  ShieldCheck,
  Stamp,
  UserRoundX,
  Video,
} from 'lucide-react';

type Category = 'Tous' | 'PDF' | 'Convertir' | 'Optimiser' | 'Documents';
type ToolCategory = Exclude<Category, 'Tous'>;

type ToolItem = {
  to: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: typeof FileArchive;
  featured?: boolean;
};

const tools: ToolItem[] = [
  { to: '/modifier-pdf', title: 'Modifier PDF', description: 'Ajoutez du texte, des images, signatures, annotations et dessins directement sur vos pages.', category: 'PDF', icon: PencilLine, featured: true },
  { to: '/fusionner-pdf', title: 'Fusionner PDF', description: 'Assemblez plusieurs PDF dans l’ordre exact de votre choix.', category: 'PDF', icon: Merge, featured: true },
  { to: '/compresser-pdf', title: 'Compresser PDF', description: 'Réduisez le poids d’un PDF en choisissant le niveau de qualité.', category: 'Optimiser', icon: FileArchive, featured: true },
  { to: '/signer-pdf', title: 'Signer PDF', description: 'Placez, déplacez et redimensionnez votre signature ou votre cachet.', category: 'PDF', icon: FileSignature, featured: true },
  { to: '/filigrane-pdf', title: 'Ajouter un filigrane', description: 'Ajoutez un texte, un logo ou un cachet avec opacité, rotation et répétition.', category: 'PDF', icon: Stamp },
  { to: '/diviser-pdf', title: 'Diviser PDF', description: 'Séparez les pages d’un document en plusieurs fichiers PDF.', category: 'PDF', icon: Scissors },
  { to: '/formulaires-pdf', title: 'Formulaires PDF', description: 'Remplissez des champs existants ou créez vos propres champs interactifs.', category: 'PDF', icon: FormInput },
  { to: '/organiser-pdf', title: 'Organiser PDF', description: 'Réordonnez visuellement les pages par glisser-déposer.', category: 'PDF', icon: Layers3 },
  { to: '/pivoter-pdf', title: 'Pivoter PDF', description: 'Tournez rapidement les pages à 90°, 180° ou 270°.', category: 'PDF', icon: RotateCw },
  { to: '/pdf-en-png', title: 'PDF en PNG', description: 'Transformez chaque page d’un PDF en image PNG haute résolution.', category: 'Convertir', icon: FileImage },
  { to: '/images-en-pdf', title: 'Images en PDF', description: 'Créez un PDF à partir de vos images et choisissez leur ordre visuellement.', category: 'Convertir', icon: Image },
  { to: '/convertir', title: 'Convertir un fichier', description: 'Convertissez images, vidéos, audio, texte et autres formats compatibles.', category: 'Convertir', icon: Files },
  { to: '/batch', title: 'Conversions par lot', description: 'Traitez plusieurs fichiers puis récupérez les résultats ensemble.', category: 'Convertir', icon: Layers3 },
  { to: '/optimiser-images', title: 'Optimiser des images', description: 'Compressez, redimensionnez, recadrez et convertissez vos images.', category: 'Optimiser', icon: Image },
  { to: '/compresser-video', title: 'Compresser une vidéo', description: 'Réduisez le poids d’une vidéo avant partage ou archivage.', category: 'Optimiser', icon: Video },
  { to: '/ocr-pdf', title: 'OCR PDF & images', description: 'Extrayez le texte d’un document pour le copier, le corriger ou le réutiliser.', category: 'Documents', icon: ScanText },
  { to: '/creer-pdf', title: 'Créer un PDF', description: 'Créez rapidement un document PDF avec contenu, logo et pied de page.', category: 'Documents', icon: FileText },
  { to: '/brouillons', title: 'Brouillons locaux', description: 'Reprenez les travaux PDF sauvegardés automatiquement dans ce navigateur.', category: 'Documents', icon: History },
  { to: '/historique', title: 'Historique local', description: 'Retrouvez les derniers fichiers traités sur cet appareil.', category: 'Documents', icon: History },
];

const categories: Category[] = ['Tous', 'PDF', 'Convertir', 'Optimiser', 'Documents'];

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      to={tool.to}
      className="group flex min-h-40 flex-col border border-slate-200 bg-white p-5 transition-colors hover:border-[#2457E6]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2457E6]">
          <tool.icon size={19} strokeWidth={1.9} />
        </span>
        <ArrowRight size={16} className="mt-2 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2457E6]" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-950">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{tool.description}</p>
      <span className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{tool.category}</span>
    </Link>
  );
}

export default function LandingPage() {
  const [category, setCategory] = useState<Category>('Tous');
  const [search, setSearch] = useState('');

  const featuredTools = tools.filter(tool => tool.featured);
  const term = search.trim().toLowerCase();
  const filteredTools = tools.filter(tool => {
    const matchesCategory = category === 'Tous' || tool.category === category;
    const matchesSearch = !term || `${tool.title} ${tool.description} ${tool.category}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="flex-grow bg-[#F7F8FA] pt-16 text-slate-950">
      <section className="border-b border-slate-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 h-1 w-12 bg-[#F26B4A]" />
          <p className="text-sm font-semibold text-[#2457E6]">Doxali · outils pour vos documents</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl md:text-6xl">
            Modifier, convertir, signer et organiser vos documents.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Choisissez une action, ajoutez vos fichiers et récupérez le résultat. Pas de compte, pas de parcours inutile.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <label htmlFor="home-tool-search" className="sr-only">Rechercher un outil</label>
            <div className="flex items-center border border-slate-300 bg-white px-4 shadow-sm focus-within:border-[#2457E6] focus-within:ring-2 focus-within:ring-[#2457E6]/10">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                id="home-tool-search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Rechercher un outil : filigrane, signer, compresser, OCR…"
                className="min-h-14 w-full border-0 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {search && <a href="#outils" className="shrink-0 text-xs font-semibold text-[#2457E6]">Voir les résultats</a>}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> Traitement local en priorité</span>
            <span className="inline-flex items-center gap-2"><UserRoundX size={16} className="text-[#2457E6]" /> Sans compte</span>
            <span className="inline-flex items-center gap-2"><InfinityIcon size={17} className="text-[#F26B4A]" /> Sans quota quotidien</span>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Accès rapide</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Les outils essentiels</h2>
            </div>
            <a href="#outils" className="hidden text-sm font-semibold text-[#2457E6] sm:inline-flex">Tous les outils</a>
          </div>

          <div className="grid overflow-hidden border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
            {featuredTools.map((tool, index) => (
              <Link
                key={tool.to}
                to={tool.to}
                className={`group p-5 transition-colors hover:bg-[#F8FAFF] ${index > 0 ? 'border-t border-slate-200 sm:border-t-0 sm:border-l' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF3FF] text-[#2457E6]"><tool.icon size={19} /></span>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-950">{tool.title}</h3>
                  <ArrowRight size={15} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2457E6]" />
                </div>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="outils" className="border-t border-slate-200 bg-white px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Catalogue</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Tous les outils</h2>
              <p className="mt-2 text-sm text-slate-500">{filteredTools.length} outil{filteredTools.length > 1 ? 's' : ''}{search ? ` pour “${search}”` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`border px-3.5 py-2 text-sm font-medium transition-colors ${category === item ? 'border-[#2457E6] bg-[#2457E6] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 grid overflow-hidden border border-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map(tool => <ToolCard key={tool.to} tool={tool} />)}
          </div>

          {filteredTools.length === 0 && (
            <div className="mt-7 border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-800">Aucun outil trouvé.</p>
              <button type="button" onClick={() => { setSearch(''); setCategory('Tous'); }} className="mt-2 text-sm font-semibold text-[#2457E6]">Réinitialiser la recherche</button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#111827] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold">Doxali va droit au but.</p>
            <p className="mt-1 text-sm text-slate-400">Vos outils documentaires réunis dans une interface simple, sans compte obligatoire.</p>
          </div>
          <Link to="/a-propos" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#AFC2FF]">Découvrir Doxali <ArrowRight size={15} /></Link>
        </div>
      </section>
    </main>
  );
}
