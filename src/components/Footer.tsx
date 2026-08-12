import { Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
            <Link to="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-slate-950">Doxali</span>
            </Link>
            <p className="text-sm text-slate-500">Outils PDF & documents, simplement.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link to="/formats" className="text-sm text-slate-500 transition-colors hover:text-slate-950">
              Formats
            </Link>
            <Link to="/conditions" className="text-sm text-slate-500 transition-colors hover:text-slate-950">
              Conditions
            </Link>
            <Link to="/a-propos" className="text-sm text-slate-500 transition-colors hover:text-slate-950">
              À propos
            </Link>
            <div className="ml-1 flex items-center gap-3">
              <a
                href="https://github.com/njaga/Convertisseur-documents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="https://linkedin.com/in/ndiagandiaye"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-center text-xs text-slate-400">
            {currentYear} Doxali. Développé par{' '}
            <a
              href="https://ndiagandiaye.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 transition-colors hover:text-slate-700"
            >
              Ndiaga Ndiaye
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
