import { Mail, Send } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Contact
          </h1>
          <p className="text-gray-500 mt-2">
            Une question ou suggestion ? Ecrivez-nous.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Coordonnees</h2>
            <div className="space-y-3">
              <a
                href="mailto:contact@ndiagandiaye.com"
                className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Mail size={16} />
                <span>contact@ndiagandiaye.com</span>
              </a>
              <p className="text-sm text-gray-500">
                Delai de reponse : 24-48 heures
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Envoyer un message</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-600 mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-600 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm text-gray-600 mb-1.5">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
                  placeholder="Sujet de votre message"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm text-gray-600 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors resize-none"
                  placeholder="Votre message..."
                  required
                />
              </div>

              {submitStatus === 'success' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  Message envoye avec succes.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  Une erreur est survenue. Veuillez reessayer.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg flex items-center justify-center gap-2 transition-colors
                  ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-800'}`}
              >
                <Send size={14} />
                {isSubmitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
