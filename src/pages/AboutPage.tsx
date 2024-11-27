import { Code, Palette, FileCheck, Github, Linkedin, Mail, Globe, Award } from 'lucide-react';

const AboutPage = () => {
  const skills = [
    { icon: Code, title: "Développement Web", items: ["JavaScript", "React", "Node.js", "TypeScript", "Next.js"] },
    { icon: Palette, title: "Design", items: ["UI/UX Design", "Figma", "Adobe XD", "Responsive Design"] },
    { icon: Globe, title: "Marketing Digital", items: ["SEO", "Analytics", "Stratégie digitale", "Content Marketing"] }
  ];

  const projects = [
    {
      name: "ColorFusion",
      url: "https://colorfusion-five.vercel.app",
      description: "Suite complète d'outils créatifs pour les designers. Génération de palettes, manipulation des couleurs et export dans différents formats.",
      tags: ["React", "TypeScript", "TailwindCSS"]
    },
    {
      name: "Sénégal Commerce",
      url: "https://senegalcommerce.com",
      description: "Marketplace 100% sénégalaise permettant aux vendeurs de créer facilement leur boutique en ligne et de toucher une plus large clientèle.",
      tags: ["Next.js", "Node.js", "MongoDB"]
    },
    {
        name: "Noflay",
        url: "https://noflay-immo.com",
        description: "Logiciel de gestion de la location immobilière. Dédié aux agences immobilières et aux particuliers. Génération de documents officiels, comptabilité, gestion des dossiers, etc.",
        tags: ["Laravel", "PHP", "MySQL", "Vue.js"]
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20">
      {/* En-tête - Ajout d'un gradient subtil */}
      <div className="border-b bg-gradient-to-b from-blue-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-blue-500/10 rounded-2xl mb-6">
              <FileCheck className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
              À Propos du Projet
            </h1>
            <p className="mt-4 text-gray-500 text-center max-w-2xl text-lg">
              Une application open source gratuite pour simplifier la conversion de fichiers
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal - Ajout d'animations et améliorations visuelles */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Présentation du Projet - Refonte complète */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100/50 shadow-lg mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileCheck className="w-6 h-6 text-blue-500" />
                  </div>
                  Le Projet
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Cette application open source a été développée dans le but d'aider les utilisateurs 
                    à convertir leurs fichiers simplement et gratuitement.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    De nouvelles fonctionnalités comme la compression de fichiers sont en cours de développement.
                    Le projet est constamment amélioré pour offrir une meilleure expérience utilisateur.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Award className="w-6 h-6 text-blue-500" />
                  </div>
                  Points Clés
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Open Source et Gratuit</h4>
                      <p className="text-sm text-gray-500">Accessible à tous, sans frais cachés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Conversion Sécurisée</h4>
                      <p className="text-sm text-gray-500">Traitement local et sécurisé des fichiers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Interface Intuitive</h4>
                      <p className="text-sm text-gray-500">Simple à utiliser pour tous les utilisateurs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Développeur - Refonte complète */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-white">
                    Le Développeur
                  </h2>
                  <p className="text-gray-300 leading-relaxed">
                    Je suis Ndiaga Ndiaye, développeur JavaScript FullStack et designer UI/UX en freelance. 
                    Expert en transformation digitale, j'accompagne les entreprises dans leur évolution numérique.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white/90">Fondateur de</h3>
                  <a 
                    href="https://kamit.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <div className="bg-white/10 backdrop-blur-lg px-4 py-3 rounded-xl hover:bg-white/20 transition-all">
                      <h4 className="text-white font-medium">Kamit Digital Solutions</h4>
                      <p className="text-sm text-blue-300">Solutions digitales innovantes</p>
                    </div>
                  </a>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://github.com/njaga"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-lg"
                  >
                    <Github className="w-4 h-4 text-blue-300" />
                    <span className="text-white">GitHub</span>
                  </a>
                  <a 
                    href="https://linkedin.com/in/ndiagandiaye"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-lg"
                  >
                    <Linkedin className="w-4 h-4 text-blue-300" />
                    <span className="text-white">LinkedIn</span>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white/90 mb-6">Expertise</h3>
                <div className="space-y-6">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <skill.icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-white font-medium">{skill.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skill.items.map((item, i) => (
                          <span 
                            key={i} 
                            className="text-sm bg-white/5 text-blue-200 px-3 py-1 rounded-full border border-white/10"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autres Projets - Amélioration des cartes */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Autres Projets</h2>
          <div className="grid grid-cols-1 gap-8">
            {projects.map((project, index) => (
              <a 
                key={index}
                href={project.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-gray-50 hover:bg-white rounded-xl p-8 transition-all hover:shadow-xl border border-gray-100"
              >
                <h3 className="font-semibold text-gray-900 mb-3 text-xl group-hover:text-blue-500 transition-colors">
                  {project.name}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Contact - Amélioration du bouton */}
        <div className="text-center pb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Des questions ou des suggestions ? N'hésitez pas à me contacter.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="mailto:contact@ndiagandiaye.com"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5" />
              contact@ndiagandiaye.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
