import { Shield, AlertCircle } from 'lucide-react';

const TermsOfUsePage = () => {
  return (
    <div className="min-h-screen bg-white py-20">
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center">
            <Shield className="w-12 h-12 text-blue-500 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Conditions d'Utilisation
            </h1>
            <p className="mt-4 text-gray-500 text-sm text-center">
              Dernière mise à jour : {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-8">
            Cette application open source a été développée dans le but d'aider les utilisateurs à convertir leurs fichiers simplement et gratuitement. 
            En utilisant ce service, vous acceptez les conditions suivantes.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-12 mb-4">
            1. Utilisation du Service
          </h2>
          <p className="text-gray-600 mb-4">
            • Le service est entièrement gratuit et open source
          </p>
          <p className="text-gray-600 mb-4">
            • L'utilisation est destinée à des fins légales uniquement
          </p>
          <p className="text-gray-600 mb-4">
            • Aucune inscription n'est nécessaire pour utiliser le service
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-12 mb-4">
            2. Protection de vos Données
          </h2>
          <p className="text-gray-600 mb-4">
            • Vos fichiers sont supprimés automatiquement après 24 heures
          </p>
          <p className="text-gray-600 mb-4">
            • Nous ne conservons aucune donnée personnelle
          </p>
          <p className="text-gray-600 mb-4">
            • Le service utilise une connexion sécurisée HTTPS
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-12 mb-4">
            3. Limitations Techniques
          </h2>
          <p className="text-gray-600 mb-4">
            • Taille maximale : 100 MB par fichier
          </p>
          <p className="text-gray-600 mb-4">
            • 10 conversions par heure pour garantir la disponibilité du service
          </p>

          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Projet en Développement
                </h3>
                <p className="text-gray-600">
                  Cette application est en constante évolution. De nouvelles fonctionnalités 
                  comme la compression de fichiers sont en cours de développement. N'hésitez pas 
                  à contribuer au projet sur GitHub.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p>Des questions ou suggestions ?</p>
            <a 
              href="mailto:contact@ndiagandiaye.com" 
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              contact@ndiagandiaye.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;