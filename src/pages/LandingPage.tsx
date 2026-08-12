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
  ScanSearch,
  ScanText,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Sparkles as WandSparkles,
  UserRoundX,
  Video,
} from 'lucide-react';

type Category = 'Tous' | 'PDF' | 'Convertir' | 'Optimiser' | 'Documents';
type ToolCategory = Exclude<Category, 'Tous'>;
type Accent = 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber';

type ToolItem = {
  to: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: typeof FileArchive;
  accent: Accent;
  featured?: boolean;
};

const tools: ToolItem[] = [
  { to: '/modifier-pdf', title: 'Modifier PDF', description: 'Ajoutez texte, images, signatures, annotations et dessins directement sur vos pages.', category: 'PDF', icon: PencilLine, accent: 'indigo', featured: true },
  { to: '/fusionner-pdf', title: 'Fusionner PDF', description: 'Assemblez plusieurs PDF dans l’ordre exact de votre choix.', category: 'PDF', icon: Merge, accent: 'violet', featured: true },
  { to: '/compresser-pdf', title: 'Compresser PDF', description: 'Réduisez le poids d’un PDF avec le niveau de qualité qui vous convient.', category: 'Optimiser', icon: FileArchive, accent: 'cyan', featured: true },
  { to: '/signer-pdf', title: 'Signer PDF', description: 'Placez, déplacez et redimensionnez votre signature ou votre cachet.', category: 'PDF', icon: FileSignature, accent: 'amber', featured: true },
  { to: '/diviser-pdf', title: 'Diviser PDF', description: 'Séparez les pages d’un document en plusieurs fichiers PDF.', category: 'PDF', icon: Scissors, accent: 'violet' },
  { to: '/formulaires-pdf', title: 'Formulaires PDF', description: 'Remplissez des champs existants ou créez vos propres champs interactifs.', category: 'PDF', icon: FormInput, accent: 'indigo' },
  { to: '/organiser-pdf', title: 'Organiser PDF', description: 'Réordonnez visuellement les pages par glisser-déposer.', category: 'PDF', icon: Layers3, accent: 'cyan' },
  { to: '/pivoter-pdf', title: 'Pivoter PDF', description: 'Tournez rapidement les pages à 90°, 180° ou 270°.', category: 'PDF', icon: RotateCw, accent: 'amber' },
  { to: '/pdf-en-png', title: 'PDF en PNG', description: 'Transformez chaque page d’un PDF en image PNG haute résolution.', category: 'Convertir', icon: FileImage, accent: 'cyan' },
  { to: '/images-en-pdf', title: 'Images en PDF', description: 'Créez un PDF à partir de vos images et choisissez leur ordre visuellement.', category: 'Convertir', icon: Image, accent: 'violet' },
  { to: '/convertir', title: 'Convertir un fichier', description: 'Convertissez images, vidéos, audio, texte et autres formats compatibles.', category: 'Convertir', icon: Files, accent: 'indigo' },
  { to: '/batch', title: 'Conversions par lot', description: 'Traitez plusieurs fichiers puis récupérez les résultats ensemble.', category: 'Convertir', icon: Layers3, accent: 'cyan' },
  { to: '/optimiser-images', title: 'Optimiser des images', description: 'Compressez, redimensionnez, recadrez et convertissez vos images.', category: 'Optimiser', icon: Image, accent: 'emerald' },
  { to: '/compresser-video', title: 'Compresser une vidéo', description: 'Réduisez le poids d’une vidéo avant partage ou archivage.', category: 'Optimiser', icon: Video, accent: 'violet' },
  { to: '/ocr-pdf', title: 'OCR PDF & images', description: 'Extrayez le texte d’un document pour le copier, corriger ou réutiliser.', category: 'Documents', icon: ScanText, accent: 'indigo' },
  { to: '/creer-pdf', title: 'Créer un PDF', description: 'Créez rapidement un document PDF avec contenu, logo et pied de page.', category: 'Documents', icon: FileText, accent: 'amber' },
  { to: '/brouillons', title: 'Brouillons locaux', description: 'Reprenez vos travaux PDF sauvegardés automatiquement dans ce navigateur.', category: 'Documents', icon: WandSparkles, accent: 'cyan' },
  { to: '/historique', title: 'Historique local', description: 'Retrouvez les derniers fichiers traités sur cet appareil.', category: 'Documents', icon: History, accent: 'emerald' },
];

const categories: Category[] = ['Tous', 'PDF', 'Convertir', 'Optimiser', 'Documents'];

const accentClasses: Record<Accent, { icon: string; border: string; arrow: string }> = {
  indigo: { icon: 'bg-indigo-50 text-indigo-600', border: 'group-hover:border-indigo-200', arrow: 'group-hover:text-indigo-600' },
  violet: { icon: 'bg-violet-50 text-violet-600', border: 'group-hover:border-violet-200', arrow: 'group-hover:text-violet-600' },
  cyan: { icon: 'bg-cyan-50 text-cyan-700', border: 'group-hover:border-cyan-200', arrow: 'group-hover:text-cyan-700' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700', border: 'group-hover:border-emerald-200', arrow: 'group-hover:text-emerald-700' },
  amber: { icon: 'bg-amber-50 text-amber-700', border: 'group-hover:border-amber-200', arrow: 'group-hover:text-amber-700' },
};

function ToolCard({ tool }: { tool: ToolItem }) {
  const accent = accentClasses[tool.accent];
  return (
    <Link to={tool.to} className={`group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${accent.border}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}><tool.icon size={20} strokeWidth={1.9} /></span>
        <ArrowRight size={17} className={`mt-2 text-slate-300 transition-all group-hover:translate-x-1 ${accent.arrow}`} />
      </div>
      <h3 className="mt-5 text-base font-bold tracking-tight text-slate-950">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{tool.description}</p>
      <span className="mt-auto pt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{tool.category}</span>
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
    <main className="flex-grow bg-slate-50 pt-16 text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#0b1020] px-6 py-16 text-white md:py-24">
        <div className="pointer-events-none absolute -left-32 top-8 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
              <Sparkles size={14} className="text-cyan-300" /> Simple, rapide et privé
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-7xl">
              Vos documents,
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">enfin simples.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              Modifiez, fusionnez, signez, compressez et convertissez vos PDF et documents — sans compte et sans parcours compliqué.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#outils" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:shadow-xl">
                Trouver un outil <ArrowRight size={16} />
              </a>
              <Link to="/modifier-pdf" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">
                <PencilLine size={16} /> Modifier un PDF
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /> Traitement local en priorité</span>
              <span className="inline-flex items-center gap-2"><UserRoundX size={16} className="text-cyan-300" /> Sans compte</span>
              <span className="inline-flex items-center gap-2"><InfinityIcon size={17} className="text-violet-300" /> Sans quota quotidien</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-indigo-500/50 via-violet-500/20 to-cyan-400/40 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-200">Accès instantané</p>
                  <h2 className="mt-1 text-xl font-bold">Que voulez-vous faire ?</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200"><ScanSearch size={19} /></span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {featuredTools.map(tool => (
                  <Link key={tool.to} to={tool.to} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3.5 transition hover:border-white/20 hover:bg-white/[0.13]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><tool.icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{tool.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">{tool.category}</span>
                    </span>
                    <ArrowRight size={14} className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                  </Link>
                ))}
              </div>

              <Link to="/images-en-pdf" className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-cyan-400/15 to-indigo-400/15 px-4 py-3.5 text-sm font-semibold text-cyan-100 ring-1 ring-inset ring-white/10 transition hover:ring-white/20">
                <span className="inline-flex items-center gap-2"><FileImage size={16} /> Images → PDF avec aperçu et réorganisation</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={19} /></span>
            <div><p className="text-sm font-bold">Vos fichiers restent privés</p><p className="mt-0.5 text-xs text-slate-500">Traitement local dès que possible.</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UserRoundX size={19} /></span>
            <div><p className="text-sm font-bold">Aucun compte requis</p><p className="mt-0.5 text-xs text-slate-500">Ouvrez l’outil et commencez.</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><InfinityIcon size={20} /></span>
            <div><p className="text-sm font-bold">Pas de quota quotidien</p><p className="mt-0.5 text-xs text-slate-500">Pas de compteur artificiel.</p></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">Les indispensables</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">Commencez par l’essentiel.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">Les actions les plus utiles sont mises en avant sans transformer l’accueil en mur de cartes identiques.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Link to="/modifier-pdf" className="group relative min-h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-7 text-white shadow-xl shadow-indigo-200/50 transition hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex h-full flex-col">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><PencilLine size={22} /></span>
                <h3 className="mt-7 text-3xl font-black tracking-[-0.03em]">Modifier un PDF</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">Texte, images, signatures, annotations, dessin et organisation des pages dans un même espace.</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold">Ouvrir l’éditeur <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredTools.slice(1).map(tool => (
                <Link key={tool.to} to={tool.to} className="group flex min-h-32 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[tool.accent].icon}`}><tool.icon size={18} /></span>
                    <ArrowRight size={16} className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
                  </div>
                  <h3 className="mt-4 font-bold">{tool.title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="outils" className="border-y border-slate-200 bg-white px-6 py-14 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">Tous les outils</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">Trouvez directement ce dont vous avez besoin.</h2>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher : signer, OCR, compresser…" aria-label="Rechercher un outil" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer les outils par catégorie">
            {categories.map(item => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-slate-950 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'}`}>
                {item}
              </button>
            ))}
          </div>

          {filteredTools.length ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTools.map(tool => <ToolCard key={tool.to} tool={tool} />)}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <Search size={28} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold">Aucun outil trouvé</h3>
              <p className="mt-2 text-sm text-slate-500">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
              <button type="button" onClick={() => { setSearch(''); setCategory('Tous'); }} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Réinitialiser</button>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-7 ring-1 ring-inset ring-indigo-100 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><WandSparkles size={20} /></span>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.03em]">Un outil documentaire qui ne vous ralentit pas.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Choisissez une action, déposez le fichier, prévisualisez, modifiez si nécessaire puis récupérez le résultat.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><ShieldCheck size={20} className="text-emerald-600" /><p className="mt-4 font-bold">Privé</p><p className="mt-2 text-xs leading-5 text-slate-500">Le traitement local reste la priorité.</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><Sparkles size={20} className="text-indigo-600" /><p className="mt-4 font-bold">Visuel</p><p className="mt-2 text-xs leading-5 text-slate-500">Aperçus, drag & drop et édition directe.</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><InfinityIcon size={20} className="text-violet-600" /><p className="mt-4 font-bold">Sans friction</p><p className="mt-2 text-xs leading-5 text-slate-500">Pas de compte ni de quota quotidien.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
