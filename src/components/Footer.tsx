import { Mail, Github, Linkedin, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="max-w-sm text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileCheck className="w-5 h-5 text-blue-500" />
              </div>
              <Link to="/" className="text-xl font-semibold text-gray-900">
                Convertisseur
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              Un outil puissant et gratuit pour convertir vos fichiers en toute simplicité.
            </p>
          </div>
          <div className="flex gap-4">
            <a 
              href="mailto:contact@ndiagandiaye.com"
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/njaga"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://linkedin.com/in/ndiagandiaye"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} - Développé par{' '}
            <a 
              href="https://ndiagandiaye.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors"
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