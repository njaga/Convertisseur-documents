import { ArrowUpRight } from 'lucide-react';

const AboutPage = () => {
  const features = [
    { title: 'Gratuit', description: 'Aucun frais cache ni abonnement' },
    { title: 'Securise', description: 'Traitement local sur votre appareil' },
    { title: 'Rapide', description: 'Conversion instantanee sans upload' },
  ];

  const projects = [
    {
      name: 'ColorFusion',
      url: 'https://colorfusion-five.vercel.app',
      description: 'Suite d\'outils creatifs pour designers. Generation de palettes et manipulation des couleurs.',
      tech: 'React, TypeScript'
    },
    {
      name: 'Noflay',
      url: 'https://noflay-immo.com',
      description: 'Logiciel de gestion locative pour agences immobilieres et particuliers.',
      tech: 'Laravel, Vue.js'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            A propos
          </h1>
          <p className="text-gray-500 mt-2">
            Application open source de conversion de fichiers
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Caracteristiques</h2>
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Developpeur</h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              Ndiaga Ndiaye - Developpeur FullStack JavaScript et designer UI/UX.
              Expert en transformation digitale.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://ndiagandiaye.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Portfolio <ArrowUpRight size={14} />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://github.com/njaga"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                GitHub <ArrowUpRight size={14} />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://linkedin.com/in/ndiagandiaye"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                LinkedIn <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Other Projects */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Autres projets</h2>
          <div className="space-y-4">
            {projects.map((project, i) => (
              <a
                key={i}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <ArrowUpRight size={14} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">{project.description}</p>
                <p className="text-xs text-gray-400">{project.tech}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
