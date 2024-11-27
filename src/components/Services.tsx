import React from 'react';
import { Code, Smartphone, Megaphone, Palette, Server, Monitor, Cloud } from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="bg-white text-black p-6 rounded-lg shadow-lg hover:transform hover:scale-105 transition-transform">
    <Icon className="w-12 h-12 mb-4" />
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Services = () => {
  const services = [
    {
      icon: Code,
      title: "Développement Web",
      description: "Sites web sur mesure, applications web, e-commerce"
    },
    {
      icon: Smartphone,
      title: "Développement Mobile",
      description: "Applications iOS et Android natives et cross-platform"
    },
    {
      icon: Megaphone,
      title: "Marketing Digital",
      description: "SEO, réseaux sociaux, publicité en ligne"
    },
    {
      icon: Palette,
      title: "Design",
      description: "UI/UX design, identité visuelle, design graphique"
    },
    {
      icon: Server,
      title: "Infogérance",
      description: "Maintenance, support technique, sécurité informatique"
    },
    {
      icon: Monitor,
      title: "Matériel Informatique",
      description: "Fourniture et installation d'équipements professionnels"
    },
    {
      icon: Cloud,
      title: "Solutions Cloud",
      description: "Services cloud, hébergement, sauvegarde de données"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">Nos Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;