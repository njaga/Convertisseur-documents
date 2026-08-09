import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Heart, LockKeyhole, Sparkles } from 'lucide-react';

export default function AboutPage(){
  return <main className="flex-grow bg-[#f7f8fa] px-6 pb-24 pt-32 text-gray-900"><div className="mx-auto max-w-4xl">
    <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-blue-600">À propos</p><h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Doxali est né d’une frustration très simple.</h1><p className="mt-6 text-xl leading-9 text-gray-600">J’en avais marre des plateformes qui vous laissent convertir quelques fichiers, puis vous bloquent avec une limite de dix opérations par jour, un compte obligatoire ou un abonnement.</p></div>
    <div className="mt-14 grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl border bg-white p-6"><Heart className="text-blue-600"/><h2 className="mt-4 font-semibold">Pourquoi je l’ai créé</h2><p className="mt-2 text-sm leading-6 text-gray-600">Je voulais un outil direct, généreux et réellement utile : ouvrir, travailler, télécharger. Sans parcours inutile.</p></div>
      <div className="rounded-2xl border bg-white p-6"><LockKeyhole className="text-blue-600"/><h2 className="mt-4 font-semibold">La confidentialité d’abord</h2><p className="mt-2 text-sm leading-6 text-gray-600">Quand c’est techniquement possible, les fichiers sont traités localement et ne quittent pas l’appareil.</p></div>
      <div className="rounded-2xl border bg-white p-6"><Sparkles className="text-blue-600"/><h2 className="mt-4 font-semibold">Une suite qui grandit</h2><p className="mt-2 text-sm leading-6 text-gray-600">Doxali ne se limite plus à convertir : il édite, compresse, analyse, signe et génère des documents.</p></div>
    </div>
    <section className="mt-14 rounded-3xl bg-gray-950 p-8 text-white md:p-12"><Code2 className="text-blue-400"/><h2 className="mt-5 text-2xl font-bold">Créé par Ndiaga Ndiaye</h2><p className="mt-4 max-w-2xl leading-7 text-gray-300">Je suis développeur full-stack et créateur de produits numériques au Sénégal. Je construis des applications web, mobiles et alimentées par l’intelligence artificielle, de l’idée jusqu’à la mise en production. Doxali est né de cette même approche : partir d’un problème concret et construire une solution simple, utile et accessible.</p><a href="https://ndiagandiaye.com" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-blue-200">Découvrir mon parcours <ArrowRight size={16}/></a></section>
    <div className="mt-10 text-center"><Link to="/convertir" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Utiliser Doxali <ArrowRight size={16}/></Link></div>
  </div></main>
}
