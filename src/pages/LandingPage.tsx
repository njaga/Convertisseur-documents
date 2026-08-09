import { Link } from 'react-router-dom';
import { ArrowRight, Files, FilePenLine, FileText, History, Images, LockKeyhole, Minimize2, ScanText, Sparkles } from 'lucide-react';

const tools = [
  { to: '/convertir', title: 'Convertir', description: 'Images, audio, vidéos et documents, seuls ou par lot.', icon: Sparkles },
  { to: '/pdf', title: 'Éditer un PDF', description: 'Réorganiser, tourner, extraire, signer ou fusionner des pages.', icon: FilePenLine },
  { to: '/optimiser', title: 'Compresser', description: 'Réduire le poids de vos images, PDF et vidéos.', icon: Minimize2 },
  { to: '/documents', title: 'Créer & analyser', description: 'OCR, annotations, signatures et génération de PDF.', icon: ScanText },
  { to: '/batch', title: 'Traitement par lot', description: 'Piloter plusieurs conversions et récupérer une archive ZIP.', icon: Files },
  { to: '/historique', title: 'Historique local', description: 'Retrouver vos résultats conservés uniquement sur cet appareil.', icon: History },
];

export default function LandingPage() {
  return <main className="flex-grow bg-[#f7f8fa] pt-16 text-gray-900">
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_38%),radial-gradient(circle_at_bottom_right,#e0e7ff_0,transparent_35%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700"><LockKeyhole size={15}/> Local-first · Sans inscription · Sans quota quotidien</div>
          <h1 className="text-5xl font-bold tracking-[-.05em] text-gray-950 md:text-7xl">Vos documents.<br/><span className="text-blue-600">Sans limites.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">Doxali réunit conversion, édition PDF, compression, OCR, signature et création de documents dans une seule suite. Vos fichiers sont traités sur votre appareil chaque fois que la technologie le permet.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/convertir" className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 font-semibold text-white hover:bg-gray-800">Commencer gratuitement <ArrowRight size={17}/></Link><Link to="/a-propos" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800">Pourquoi Doxali ?</Link></div>
        </div>
      </div>
    </section>

    <section className="px-6 pb-24"><div className="mx-auto max-w-6xl">
      <div className="mb-8 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-blue-600">Une seule suite</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Tout ce qu’il faut pour travailler avec vos fichiers</h2></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{tools.map(tool=><Link key={tool.to} to={tool.to} className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"><tool.icon size={21}/></div><h3 className="mt-5 text-lg font-semibold">{tool.title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{tool.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gray-900">Ouvrir <ArrowRight size={14}/></span></Link>)}</div>
    </div></section>

    <section className="bg-gray-950 px-6 py-20 text-white"><div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
      <div><Images className="text-blue-400"/><h3 className="mt-4 font-semibold">Aucun quota artificiel</h3><p className="mt-2 text-sm leading-6 text-gray-400">Pas de limite arbitraire de dix conversions quotidiennes.</p></div>
      <div><LockKeyhole className="text-blue-400"/><h3 className="mt-4 font-semibold">Pensé pour la confidentialité</h3><p className="mt-2 text-sm leading-6 text-gray-400">La majorité des opérations restent dans votre navigateur.</p></div>
      <div><FileText className="text-blue-400"/><h3 className="mt-4 font-semibold">Plus qu’un convertisseur</h3><p className="mt-2 text-sm leading-6 text-gray-400">Une boîte à outils documentaire qui évolue avec les besoins réels.</p></div>
    </div></section>
  </main>;
}
