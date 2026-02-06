import { Shield, Zap, Lock, Clock, Code, ArrowUpRight } from 'lucide-react';

const TermsOfUsePage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Confidentialite',
      description: 'Vos fichiers restent sur votre appareil',
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Conversion instantanee sans upload',
    },
    {
      icon: Lock,
      title: 'Securite',
      description: 'Aucune donnee stockee sur nos serveurs',
    },
    {
      icon: Clock,
      title: 'Disponibilite',
      description: 'Service accessible 24h/24',
    },
  ];

  const terms = [
    {
      title: 'Utilisation',
      items: [
        'Service gratuit et open source',
        'Usage personnel et professionnel autorise',
        'Aucune inscription requise',
      ],
    },
    {
      title: 'Limites',
      items: [
        '100 MB par fichier maximum',
        'Documents: 1800 conversions/mois (API)',
        'Images/Videos/Audio: illimite (local)',
      ],
    },
    {
      title: 'Responsabilite',
      items: [
        'Service fourni "tel quel"',
        'Aucune garantie de disponibilite',
        'Utilisateur responsable du contenu',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-600 mb-6">
            <Code size={14} />
            <span>Open Source Project</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Conditions d'utilisation
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Un service simple, transparent et respectueux de votre vie privee.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-3xl mx-auto px-6 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gray-900 transition-colors">
                  <feature.icon size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms Cards */}
      <div className="max-w-3xl mx-auto px-6 mt-12">
        <div className="grid md:grid-cols-3 gap-4">
          {terms.map((section, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-lg text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                {section.title}
              </h2>
              <ul className="space-y-2.5">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Card */}
      <div className="max-w-3xl mx-auto px-6 mt-12">
        <div className="relative overflow-hidden bg-gray-900 rounded-2xl p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-800 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-gray-800 to-transparent rounded-full blur-2xl opacity-30" />

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Developpe par</p>
                <h3 className="text-xl font-semibold text-white">Ndiaga Ndiaye</h3>
                <p className="text-gray-400 mt-1">UI/UX Designer & Front-end Developer</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://ndiagandiaye.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Portfolio
                  <ArrowUpRight size={14} />
                </a>
                <a
                  href="https://github.com/njaga"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  GitHub
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Next.js', 'Figma', 'Tailwind CSS', 'UI/UX'].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-3xl mx-auto px-6 mt-8 text-center">
        <p className="text-sm text-gray-400">
          Questions ? <a href="mailto:contact@ndiagandiaye.com" className="text-gray-600 hover:text-gray-900 transition-colors">contact@ndiagandiaye.com</a>
        </p>
      </div>
    </div>
  );
};

export default TermsOfUsePage;