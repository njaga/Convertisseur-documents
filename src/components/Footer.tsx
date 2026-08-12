import { ArrowUpRight, Github, Linkedin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const productLinks = [
  { to: '/modifier-pdf', label: 'Modifier PDF' },
  { to: '/fusionner-pdf', label: 'Fusionner PDF' },
  { to: '/compresser-pdf', label: 'Compresser PDF' },
  { to: '/filigrane-pdf', label: 'Ajouter un filigrane' },
  { to: '/convertir', label: 'Convertir un fichier' },
];

const resourceLinks = [
  { to: '/formats', label: 'Formats pris en charge' },
  { to: '/historique', label: 'Historique local' },
  { to: '/brouillons', label: 'Brouillons locaux' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/conditions', label: 'Conditions' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111827] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.25fr_0.75fr_0.75fr] lg:py-14">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white"><Logo size={27} /></span>
              <span className="text-xl font-bold tracking-[-0.025em]">Doxali</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#F26B4A]" aria-hidden="true" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Des outils PDF et documentaires simples, rapides et pensés pour travailler sans compte ni parcours inutile.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
              <ShieldCheck size={14} className="text-[#8EA8FF]" />
              Traitement local en priorité
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Outils</p>
            <nav className="mt-4 space-y-3" aria-label="Outils dans le pied de page">
              {productLinks.map(link => (
                <Link key={link.to} to={link.to} className="block text-sm text-slate-300 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Doxali</p>
            <nav className="mt-4 space-y-3" aria-label="Ressources dans le pied de page">
              {resourceLinks.map(link => (
                <Link key={link.to} to={link.to} className="block text-sm text-slate-300 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>© {currentYear} Doxali</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" aria-hidden="true" />
          <span>Apache-2.0</span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" aria-hidden="true" />
          <span>
            Développé par{' '}
            <a href="https://ndiagandiaye.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-white">
              Ndiaga Ndiaye <ArrowUpRight size={11} />
            </a>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/njaga/Convertisseur-documents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            aria-label="Code source GitHub"
          >
            <Github size={17} />
          </a>
          <a
            href="https://linkedin.com/in/ndiagandiaye"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            aria-label="LinkedIn de Ndiaga Ndiaye"
          >
            <Linkedin size={17} />
          </a>
        </div>
      </div>
    </footer>
  );
}
