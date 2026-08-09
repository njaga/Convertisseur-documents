import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const tools = [
  { to: '/pdf', number: '01', title: 'Travailler un PDF', description: 'Réorganiser, tourner, extraire, fusionner et signer des pages.' },
  { to: '/convertir', number: '02', title: 'Convertir des fichiers', description: 'Transformer images, audio, vidéos et documents dans le navigateur.' },
  { to: '/optimiser', number: '03', title: 'Réduire le poids', description: 'Compresser vos images, PDF et vidéos selon la qualité souhaitée.' },
  { to: '/documents', number: '04', title: 'Créer et analyser', description: 'Utiliser l’OCR, annoter, signer ou générer un nouveau document.' },
  { to: '/batch', number: '05', title: 'Traiter plusieurs fichiers', description: 'Lancer des opérations en lot et récupérer les résultats dans une archive ZIP.' },
  { to: '/historique', number: '06', title: 'Retrouver un résultat', description: 'Consulter les opérations conservées localement sur cet appareil.' },
];

export default function LandingPage() {
  return (
    <main className="flex-grow bg-white pt-16 text-gray-950">
      <section className="border-b border-gray-200 px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Suite documentaire locale</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] md:text-6xl">
              Les outils essentiels pour vos documents, réunis au même endroit.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-600">
              Doxali permet de convertir, éditer, compresser et analyser vos fichiers sans compte et sans quota quotidien. La majorité des opérations s’effectuent directement sur votre appareil.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link to="/pdf" className="inline-flex items-center gap-2 bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
                Ouvrir les outils PDF <ArrowRight size={16} />
              </Link>
              <Link to="/convertir" className="text-sm font-semibold text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-gray-950">
                Convertir un fichier
              </Link>
            </div>
          </div>

          <dl className="border-l border-gray-300 pl-6">
            <div className="border-b border-gray-200 pb-5">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Compte requis</dt>
              <dd className="mt-1 text-xl font-medium">Non</dd>
            </div>
            <div className="border-b border-gray-200 py-5">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Quota quotidien</dt>
              <dd className="mt-1 text-xl font-medium">Aucun</dd>
            </div>
            <div className="pt-5">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Traitement</dt>
              <dd className="mt-1 text-xl font-medium">Local en priorité</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 border-b border-gray-300 pb-8 md:grid-cols-2 md:items-end">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Que voulez-vous faire ?</h2>
            <p className="max-w-lg text-base leading-7 text-gray-600 md:justify-self-end">
              Choisissez une tâche. Chaque espace regroupe uniquement les commandes utiles, sans parcours inutile.
            </p>
          </div>

          <div>
            {tools.map(tool => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group grid gap-3 border-b border-gray-200 py-7 transition-colors hover:bg-gray-50 md:grid-cols-[64px_1fr_1.4fr_auto] md:items-center md:px-4"
              >
                <span className="text-xs font-medium tabular-nums text-gray-400">{tool.number}</span>
                <h3 className="text-lg font-semibold">{tool.title}</h3>
                <p className="max-w-xl text-sm leading-6 text-gray-600">{tool.description}</p>
                <ArrowRight size={18} className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-950" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1.5fr]">
          <h2 className="text-2xl font-semibold tracking-tight">Pourquoi Doxali existe</h2>
          <div>
            <p className="text-lg leading-8 text-gray-700">
              Parce qu’un outil simple ne devrait pas bloquer votre travail après dix conversions. Doxali est conçu comme une boîte à outils documentaire accessible, directe et respectueuse de vos fichiers.
            </p>
            <Link to="/a-propos" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
              En savoir plus sur le projet <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
