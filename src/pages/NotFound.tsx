import { ArrowRight, FileText, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex-grow bg-white px-6 pb-20 pt-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2457E6]">Erreur 404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">
          Cette page n’existe pas.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600">
          Le lien est peut-être incorrect ou la page a été déplacée. Vous pouvez revenir à l’accueil ou consulter les formats pris en charge.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2457E6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e49c4]"
          >
            <Home size={17} />
            Retour à l’accueil
          </Link>
          <Link
            to="/formats"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:border-gray-300"
          >
            <FileText size={17} />
            Voir les formats
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}
