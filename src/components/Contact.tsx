import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">Contactez-nous</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-4">Nos Coordonnées</h3>
            
            <div className="flex items-center space-x-4">
              <Mail className="w-6 h-6" />
              <span>contact@kamit-digital.com</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Phone className="w-6 h-6" />
              <span>+33 1 23 45 67 89</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <MapPin className="w-6 h-6" />
              <span>123 Avenue de l'Innovation, 75001 Paris</span>
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-white text-black"
                placeholder="Votre nom"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 rounded-lg bg-white text-black"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                className="w-full px-4 py-2 rounded-lg bg-white text-black h-32"
                placeholder="Votre message"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full bg-white text-black py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;