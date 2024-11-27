import { Mail, Github, Linkedin, MessageSquare, Send, Clock, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête amélioré */}
        <div className="text-center my-16">
          <div className="inline-block p-3 bg-blue-500/10 rounded-2xl mb-6">
            <MessageSquare className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Une question ou une suggestion ? N'hésitez pas à nous contacter.
            Notre équipe vous répondra dans les plus brefs délais.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            {/* Informations de contact améliorées */}
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Informations
                </h2>
                <div className="space-y-6">
                  <a 
                    href="mailto:contact@ndiagandiaye.com"
                    className="flex items-center gap-4 text-gray-600 hover:text-blue-500 transition-colors group"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-gray-500">contact@ndiagandiaye.com</div>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Téléphone</div>
                      <div className="text-sm text-gray-500">+221 78 163 34 19</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Adresse</div>
                      <div className="text-sm text-gray-500">Dakar, Sénégal</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Délai de réponse</div>
                      <div className="text-sm text-gray-500">24-48 heures</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-semibold mb-6">Réseaux sociaux</h2>
                <div className="space-y-4">
                  <a 
                    href="https://github.com/njaga"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-gray-300 hover:text-blue-400 transition-colors group"
                  >
                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <Github className="w-5 h-5" />
                    </div>
                    <span>GitHub</span>
                  </a>
                  <a 
                    href="https://linkedin.com/in/ndiagandiaye"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-gray-300 hover:text-blue-400 transition-colors group"
                  >
                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Formulaire de contact amélioré */}
            <div className="md:col-span-3">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      placeholder="Le sujet de votre message"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      placeholder="Votre message..."
                      required
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span>Message envoyé avec succès !</span>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span>Une erreur est survenue. Veuillez réessayer.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                      ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-blue-500/25'}`}
                  >
                    <Send className={`w-5 h-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
