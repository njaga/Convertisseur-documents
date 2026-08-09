import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import Logo from './Logo';

const mainLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/pdf', label: 'PDF' },
  { to: '/optimiser', label: 'Compression' },
  { to: '/documents', label: 'Documents' },
];

const moreLinks = [
  { to: '/convertir', label: 'Convertir des fichiers' },
  { to: '/batch', label: 'Conversions par lot' },
  { to: '/historique', label: 'Historique local' },
  { to: '/a-propos', label: 'À propos' },
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
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
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

  return (
    <nav className={`fixed z-50 w-full border-b border-gray-100 transition ${isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur'}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" onClick={() => setMoreOpen(false)} className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-bold tracking-tight text-gray-950">Doxali</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {mainLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMoreOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-950">
                {link.label}
              </Link>
            ))}

            <div ref={moreMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(open => !open)}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-950"
              >
                Plus
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  {moreLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobile(open => !open)} className="rounded-lg p-2 text-gray-600 md:hidden" aria-label="Menu" aria-expanded={mobile}>
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobile && (
          <div className="border-t border-gray-100 py-3 md:hidden">
            {[...mainLinks, ...moreLinks].map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobile(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
