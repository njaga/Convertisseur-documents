import { FileCheck } from 'lucide-react';

const Hero = () => {
  return (
    <section id="accueil" className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black to-gray-900 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          <div className="inline-block p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-8">
            <FileCheck className="w-16 h-16 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Convertisseur de Fichiers Universel
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
            Convertissez instantanément vos fichiers dans plus de 50 formats différents. 
            Simple, rapide et sécurisé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#upload" className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-all transform hover:scale-105">
              Commencer la conversion
            </a>
            <a href="#formats" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold backdrop-blur-sm transition-all">
              Voir les formats supportés
            </a>
          </div>
          <div id="conditions" className="mt-20">
            <h2 className="text-2xl font-semibold mb-4">Conditions d'Utilisation</h2>
            {/* Contenu des conditions d'utilisation */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;