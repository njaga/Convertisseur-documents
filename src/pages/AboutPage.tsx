import { ArrowRight, Code2, LockKeyhole, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

const principles = [
  {
    icon: Workflow,
    title: 'Un parcours direct',
    description: 'Ouvrir un fichier, effectuer l’opération utile, vérifier le résultat puis le télécharger. Sans étape artificielle.',
  },
  {
    icon: LockKeyhole,
    title: 'Local-first',
    description: 'Quand le navigateur sait effectuer l’opération de manière fiable, le fichier reste sur l’appareil.',
  },
  {
    icon: Code2,
    title: 'Des capacités vérifiables',
    description: 'Doxali n’affiche pas une conversion ou un outil tant que son moteur n’est pas réellement disponible.',
  },
];

export default function AboutPage() {
  return (
    <main className="flex-grow bg-white px-6 pb-24 pt-32 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2457E6]">À propos</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">
            Doxali part d’un besoin simple : travailler sur un document sans parcours inutile.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Le projet rassemble des outils PDF et de conversion accessibles sans compte. Sa priorité est de proposer des opérations utiles, compréhensibles et réellement prises en charge par les moteurs disponibles.
          </p>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3" aria-label="Principes de Doxali">
          {principles.map(item => (
            <article key={item.title} className="rounded-2xl border border-gray-200 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2457E6]">
                <item.icon size={19} />
              </div>
              <h2 className="mt-4 font-semibold text-gray-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 grid gap-8 border-t border-gray-200 pt-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">Le projet</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">Créé et maintenu par Ndiaga Ndiaye</h2>
          </div>
          <div>
            <p className="text-base leading-7 text-gray-600">
              Je suis développeur full-stack au Sénégal et je conçois des produits web et mobiles, de l’idée jusqu’à la mise en production. Doxali est un projet open source construit autour d’un principe d’ingénierie simple : préférer une fonctionnalité claire et vérifiable à une longue liste de promesses.
            </p>
            <a
              href="https://ndiagandiaye.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2457E6] hover:underline"
            >
              Découvrir mon parcours <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <div className="mt-12">
          <Link
            to="/convertir"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2457E6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e49c4]"
          >
            Utiliser Doxali <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
