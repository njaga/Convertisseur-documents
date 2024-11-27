import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, FileText, Mail } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* En-tête avec icône */}
        <div className="mb-8 mt-12">
          <div className="inline-block p-3 bg-red-500/10 rounded-2xl mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Page Non Trouvée
          </h2>
          <p className="text-gray-600 text-lg">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Séparateur */}
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full mb-8"></div>

        {/* Liens de navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
          >
            <Home className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
            <span className="font-medium text-gray-800 group-hover:text-gray-900">Accueil</span>
          </Link>
          
          <Link 
            to="/formats" 
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
          >
            <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
            <span className="font-medium text-gray-800 group-hover:text-gray-900">Formats</span>
          </Link>
          
          <Link 
            to="/contact" 
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
          >
            <Mail className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
            <span className="font-medium text-gray-800 group-hover:text-gray-900">Contact</span>
          </Link>
        </div>

        {/* Message d'aide */}
        <div className="bg-blue-50 p-6 rounded-2xl max-w-2xl mx-auto">
          <p className="text-gray-600">
            Besoin d'aide ? N'hésitez pas à{' '}
            <Link 
              to="/contact" 
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              nous contacter
            </Link>
            {' '}ou retourner à la{' '}
            <Link 
              to="/" 
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              page d'accueil
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
