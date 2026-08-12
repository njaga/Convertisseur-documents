import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  FileArchive,
  FileImage,
  FileSignature,
  FileText,
  Files,
  FormInput,
  History,
  Image,
  Layers3,
  Menu,
  PencilLine,
  RotateCw,
  Save,
  ScanText,
  Scissors,
  Split,
  Stamp,
  X,
  Zap,
} from 'lucide-react';
import Logo from './Logo';

const mainLinks = [
  { to: '/fusionner-pdf', label: 'Fusionner' },
  { to: '/modifier-pdf', label: 'Modifier' },
  { to: '/compresser-pdf', label: 'Compresser' },
  { to: '/convertir', label: 'Convertir' },
];

const toolGroups = [
  {
    title: 'PDF',
    description: 'Modifier, organiser et protéger',
    links: [
      { to: '/fusionner-pdf', label: 'Fusionner PDF', icon: Layers3 },
      { to: '/diviser-pdf', label: 'Diviser PDF', icon: Scissors },
      { to: '/modifier-pdf', label: 'Modifier PDF', icon: PencilLine },
      { to: '/organiser-pdf', label: 'Organiser PDF', icon: Split },
      { to: '/pivoter-pdf', label: 'Pivoter PDF', icon: RotateCw },
      { to: '/formulaires-pdf', label: 'Formulaires PDF', icon: FormInput },
      { to: '/signer-pdf', label: 'Signer PDF', icon: FileSignature },
      { to: '/filigrane-pdf', label: 'Ajouter un filigrane', icon: Stamp },
    ],
  },
  {
    title: 'Convertir',
    description: 'Changer de format simplement',
    links: [
      { to: '/images-en-pdf', label: 'Images en PDF', icon: Image },
      { to: '/pdf-en-png', label: 'PDF en PNG', icon: FileImage },
      { to: '/convertir', label: 'Convertir un fichier', icon: Files },
      { to: '/batch', label: 'Conversions par lot', icon: Layers3 },
    ],
  },
  {
    title: 'Optimiser',
    description: 'Réduire le poids des fichiers',
    links: [
      { to: '/compresser-pdf', label: 'Compresser PDF', icon: FileArchive },
      { to: '/optimiser-images', label: 'Optimiser des images', icon: Image },
      { to: '/compresser-video', label: 'Compresser une vidéo', icon: Zap },
    ],
  },
  {
    title: 'Documents',
    description: 'Créer, extraire et retrouver',
    links: [
      { to: '/ocr-pdf', label: 'OCR PDF & images', icon: ScanText },
      { to: '/creer-pdf', label: 'Créer un PDF', icon: FileText },
      { to: '/brouillons', label: 'Brouillons locaux', icon: Save },
      { to: '/historique', label: 'Historique local', icon: History },
    ],
  },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const closeMenus = () => {
    setMoreOpen(false);
    setMobile(false);
  };
  const isActive = (to: string) => pathname === to;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur transition ${isScrolled ? 'border-slate-200 shadow-[0_6px_24px_rgba(15,23,42,0.06)]' : 'border-slate-200/80'}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 lg:px-6" aria-label="Navigation principale">
        <Link to="/" onClick={closeMenus} className="flex shrink-0 items-center gap-2.5" aria-label="Doxali - Accueil">
          <Logo size={31} />
          <span className="text-lg font-bold tracking-[-0.025em] text-slate-950">Doxali</span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-[#F26B4A] sm:block" aria-hidden="true" />
        </Link>

        <div className="hidden flex-1 items-center justify-end lg:flex">
          <div className="flex items-center gap-1">
            {mainLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMoreOpen(false)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${isActive(link.to) ? 'text-[#2457E6]' : 'text-slate-600 hover:text-slate-950'}`}
              >
                {link.label}
                {isActive(link.to) && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-[#2457E6]" aria-hidden="true" />}
              </Link>
            ))}
          </div>

          <div className="mx-4 h-5 w-px bg-slate-200" aria-hidden="true" />

          <div ref={moreMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(open => !open)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${moreOpen ? 'text-[#2457E6]' : 'text-slate-800 hover:text-[#2457E6]'}`}
            >
              Tous les outils
              <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div role="menu" className="absolute right-0 top-full mt-3 w-[860px] overflow-hidden border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                <div className="grid grid-cols-4">
                  {toolGroups.map((group, groupIndex) => (
                    <section key={group.title} className={`p-5 ${groupIndex > 0 ? 'border-l border-slate-100' : ''}`}>
                      <p className="text-xs font-bold uppercase tracking-[0.11em] text-slate-900">{group.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{group.description}</p>
                      <div className="mt-4 space-y-1">
                        {group.links.map(link => (
                          <Link
                            key={link.to}
                            to={link.to}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            className={`group flex items-center gap-2.5 px-2.5 py-2.5 text-sm transition-colors ${isActive(link.to) ? 'bg-[#EEF3FF] font-semibold text-[#2457E6]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                          >
                            <link.icon size={15} className={isActive(link.to) ? 'text-[#2457E6]' : 'text-slate-400 group-hover:text-[#2457E6]'} />
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-[#F7F8FA] px-5 py-3">
                  <p className="text-xs text-slate-500">Traitement local en priorité · Sans compte · Open source</p>
                  <Link to="/formats" onClick={() => setMoreOpen(false)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457E6]">Voir les formats <ArrowRight size={13} /></Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobile(open => !open)}
          className="ml-auto flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-label={mobile ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobile}
        >
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobile && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-5 py-5 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={closeMenus} className={`border px-3 py-3 text-sm font-semibold ${isActive(link.to) ? 'border-[#2457E6] bg-[#EEF3FF] text-[#2457E6]' : 'border-slate-200 text-slate-800'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {toolGroups.map(group => (
              <section key={group.title}>
                <div className="border-b border-slate-100 pb-2">
                  <p className="text-xs font-bold uppercase tracking-[0.11em] text-slate-900">{group.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{group.description}</p>
                </div>
                <div className="mt-2">
                  {group.links.map(link => (
                    <Link key={link.to} to={link.to} onClick={closeMenus} className={`flex items-center gap-2.5 px-2 py-2.5 text-sm ${isActive(link.to) ? 'font-semibold text-[#2457E6]' : 'text-slate-600'}`}>
                      <link.icon size={15} className="text-slate-400" /> {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link to="/a-propos" onClick={closeMenus} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2457E6]">À propos de Doxali <ArrowRight size={14} /></Link>
          </div>
        </div>
      )}
    </header>
  );
}
