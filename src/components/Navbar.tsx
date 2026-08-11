import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileArchive, FileImage, FileSignature, FileText, Files, History, Image, Layers3, Menu, RotateCw, ScanText, Scissors, Settings2, Split, X, Zap } from 'lucide-react';
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
      { to: '/modifier-pdf', label: 'Modifier les pages', icon: Settings2 },
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
    <nav className={`fixed z-50 w-full border-b border-gray-100 transition ${isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur'}`}>
      <div className="mx-auto max-w-7xl px-5 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link to="/" onClick={closeMenus} className="flex shrink-0 items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-bold tracking-tight text-gray-950">Doxali</span>
          </Link>

          <div className="hidden flex-1 items-center justify-end gap-6 lg:flex">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMoreOpen(false)} className="whitespace-nowrap text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600">{link.label}</Link>
            ))}

            <div ref={moreMenuRef} className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen(open => !open)} className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors ${moreOpen ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                Tous les outils
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-4 w-[780px] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
                  <div className="grid grid-cols-4 gap-5">
                    {toolGroups.map(group => (
                      <section key={group.title}>
                        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{group.title}</p>
                        <div className="space-y-1">
                          {group.links.map(link => (
                            <Link key={link.to} to={link.to} role="menuitem" onClick={() => setMoreOpen(false)} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><link.icon size={15} /></span>
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

          <button onClick={() => setMobile(open => !open)} className="rounded-lg p-2 text-gray-600 lg:hidden" aria-label="Menu" aria-expanded={mobile}>
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobile && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-gray-100 py-4 lg:hidden">
            <div className="grid gap-1 sm:grid-cols-2">
              {mainLinks.map(link => <Link key={link.to} to={link.to} onClick={closeMenus} className="rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">{link.label}</Link>)}
            </div>
            <div className="mt-4 grid gap-5 border-t border-gray-100 pt-4 sm:grid-cols-2">
              {toolGroups.map(group => (
                <section key={group.title}>
                  <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">{group.title}</p>
                  {group.links.map(link => <Link key={link.to} to={link.to} onClick={closeMenus} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><link.icon size={15} /> {link.label}</Link>)}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
