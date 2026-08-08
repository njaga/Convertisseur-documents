import { Code, Smartphone, Megaphone, Palette, Server, Monitor, Cloud, type LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ServiceCard = ({ icon: Icon, title, description }: ServiceCardProps) => (
  <div className="bg-white text-black p-6 rounded-lg shadow-lg hover:transform hover:scale-105 transition-transform">
    <Icon className="w-12 h-12 mb-4" />
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Services = () => {
  const services: ServiceCardProps[] = [
    { icon: Code, title: 'Developpement Web', description: 'Sites web sur mesure, applications web, e-commerce' },
    { icon: Smartphone, title: 'Developpement Mobile', description: 'Applications iOS et Android natives et cross-platform' },
    { icon: Megaphone, title: 'Marketing Digital', description: 'SEO, reseaux sociaux, publicite en ligne' },
    { icon: Palette, title: 'Design', description: 'UI/UX design, identite visuelle, design graphique' },
    { icon: Server, title: 'Infogerance', description: 'Maintenance, support technique, securite informatique' },
    { icon: Monitor, title: 'Materiel Informatique', description: "Fourniture et installation d'equipements professionnels" },
    { icon: Cloud, title: 'Solutions Cloud', description: 'Services cloud, hebergement, sauvegarde de donnees' },
  ];

  return (
    <section id="services" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">Nos Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map(service => <ServiceCard key={service.title} {...service} />)}
        </div>
      </div>
    </section>
  );
};

export default Services;
