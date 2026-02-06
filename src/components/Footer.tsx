import { Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link to="/" className="text-lg font-semibold text-gray-900">
              FileConvert
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Conversion de fichiers simple et gratuite
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link to="/conditions" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Conditions
            </Link>
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              A propos
            </Link>
            <div className="flex items-center gap-3 ml-4">
              <a
                href="https://github.com/njaga"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="https://linkedin.com/in/ndiagandiaye"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            {currentYear} FileConvert. Developpe par{' '}
            <a
              href="https://ndiagandiaye.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
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