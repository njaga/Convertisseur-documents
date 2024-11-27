import { Shield, Zap, Users, Award } from 'lucide-react';
import { FeatureCardProps } from '../types/common';

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl">
    <Icon className="w-12 h-12 text-blue-400 mb-4" />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Sécurité Garantie",
      description: "Vos fichiers sont traités de manière sécurisée et supprimés automatiquement après la conversion."
    },
    {
      icon: Zap,
      title: "Conversion Rapide",
      description: "Notre technologie de pointe assure des conversions ultra-rapides, même pour les gros fichiers."
    },
    {
      icon: Users,
      title: "Pour Tous",
      description: "Interface intuitive adaptée aussi bien aux débutants qu'aux professionnels."
    },
    {
      icon: Award,
      title: "Qualité Optimale",
      description: "Conversion haute fidélité préservant la qualité de vos fichiers originaux."
    }
  ];

  return (
    <section id="apropos" className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">À Propos de Notre Service</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Nous proposons une solution complète et professionnelle pour tous vos besoins de conversion de fichiers,
            avec une attention particulière portée à la sécurité et à la qualité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <p className="text-gray-200">Fichiers Convertis</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <p className="text-gray-200">Formats Supportés</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100K+</div>
              <p className="text-gray-200">Utilisateurs Satisfaits</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;