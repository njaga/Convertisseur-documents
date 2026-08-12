import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileArchive, FileImage, FileSignature, FileText, Files, FormInput, History, Image, Layers3, Menu, PencilLine, RotateCw, Save, ScanText, Scissors, Split, X, Zap } from 'lucide-react';
import Logo from './Logo';

const mainLinks = [
  { to: '/fusionner-pdf', label: 'Fusionner PDF' },
  { to: '/diviser-pdf', label: 'Diviser PDF' },
  { to: '/compresser-pdf', label: 'Compresser PDF' },
  { to: '/convertir', label: 'Convertir' },
];

const toolGroups = [
  {
    title: 'Organiser PDF',
    links: [
      { to: '/fusionner-pdf', label: 'Fusionner PDF', icon: Layers3 },
      { to: '/diviser-pdf', label: 'Diviser PDF', icon: Scissors },
      { to: '/modifier-pdf', label: 'Modifier le contenu', icon: PencilLine },
      { to: '/formulaires-pdf', label: 'Formulaires PDF', icon: FormInput },
      { to: '/organiser-pdf', label: 'Organiser PDF', icon: Split },
      { to: '/pivoter-pdf', label: 'Faire pivoter', icon: RotateCw },
      { to: '/signer-pdf', label: 'Signer & annoter', icon: FileSignature },
    ],
  },
  {
    title: 'Optimiser',
    links: [
      { to: '/compresser-pdf', label: 'Compresser PDF', icon: FileArchive },
      { to: '/optimiser-images', label: 'Optimiser des images', icon: Image },
      { to: '/compresser-video', label: 'Compresser une vidéo', icon: Zap },
    ],
  },
  {
    title: 'Convertir',
    links: [
      { to: '/images-en-pdf', label: 'Images en PDF', icon: FileImage },
      { to: '/pdf-en-png', label: 'PDF en PNG', icon: FileImage },
      { to: '/convertir', label: 'Convertir un fichier', icon: Files },
      { to: '/batch', label: 'Conversions par lot', icon: Layers3 },
    ],
  },
  {
    title: 'Documents',
    links: [
      { to: '/ocr-pdf', label: 'OCR PDF & images', icon: ScanText },
      { to: '/creer-pdf', label: 'Créer un PDF', icon: FileText },
      { to: '/brouillons', label: 'Brouillons locaux', icon: Save },
      { to: '/historique', label: 'Historique local', icon: History },
      { to: '/a-propos', label: 'À propos de Doxali', icon: FileArchive },
    ],
  },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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

  return (
    <nav className={`fixed z-50 w-full border-b border-slate-200/80 transition ${isScrolled ? 'bg-white/95 shadow-sm backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl'}`}>
      <div className="mx-auto max-w-7xl px-5 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link to="/" onClick={closeMenus} className="group flex shrink-0 items-center gap-2.5">
            <Logo size={32} className="transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-black tracking-[-0.03em] text-slate-950">Doxali</span>
          </Link>

          <div className="hidden flex-1 items-center justify-end gap-6 lg:flex">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMoreOpen(false)} className="whitespace-nowrap text-sm font-semibold text-slate-700 transition-colors hover:text-indigo-600">{link.label}</Link>
            ))}

            <div ref={moreMenuRef} className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen(open => !open)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold transition-all ${moreOpen ? 'border-indigo-200 bg-indigo-100 text-indigo-700' : 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-100'}`}>
                Tous les outils
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-4 w-[780px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/15">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="grid grid-cols-4 gap-5 pt-1">
                    {toolGroups.map(group => (
                      <section key={group.title}>
                        <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{group.title}</p>
                        <div className="space-y-1">
                          {group.links.map(link => (
                            <Link key={link.to} to={link.to} role="menuitem" onClick={() => setMoreOpen(false)} className="group flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-indigo-600"><link.icon size={15} /></span>
                              <span>{link.label}</span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobile(open => !open)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm lg:hidden" aria-label="Menu" aria-expanded={mobile}>
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobile && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-100 py-4 lg:hidden">
            <div className="grid gap-1 sm:grid-cols-2">
              {mainLinks.map(link => <Link key={link.to} to={link.to} onClick={closeMenus} className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700">{link.label}</Link>)}
            </div>
            <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {toolGroups.map(group => (
                <section key={group.title}>
                  <p className="mb-1 px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{group.title}</p>
                  {group.links.map(link => <Link key={link.to} to={link.to} onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"><link.icon size={15} /> {link.label}</Link>)}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
