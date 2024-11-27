import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, FileCheck } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo amélioré */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
              <FileCheck className="w-7 h-7 text-blue-500" />
            </div>
            <Link to="/" className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Convertisseur
              </span>
            </Link>
          </div>

          {/* Navigation desktop améliorée */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/formats" 
              className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors relative group"
            >
              <span>Formats supportés</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link 
              to="/conditions" 
              className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors relative group"
            >
              <span>Conditions d'utilisation</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors relative group"
            >
              <span>À propos</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <Link 
              to="/contact" 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              Contact
            </Link>
          </div>

          {/* Menu mobile amélioré */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu mobile dropdown amélioré */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-x-4 top-24 p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-xl divide-y divide-gray-100">
              <div className="py-2">
                <Link
                  to="/"
                  className="block px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Accueil
                </Link>
                <Link
                  to="/formats"
                  className="block px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Formats supportés
                </Link>
                <Link
                  to="/conditions"
                  className="block px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Conditions d'utilisation
                </Link>
                <Link
                  to="/about"
                  className="block px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  À propos
                </Link>
              </div>
              <div className="p-4">
                <a
                  href="#contact"
                  className="block text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;