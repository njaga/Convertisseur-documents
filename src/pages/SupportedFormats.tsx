import { Image, FileVideo, FileAudio, FileText, FileIcon, LucideIcon, Shield, Zap, Clock, Info } from 'lucide-react';

interface FormatCategoryProps {
  title: string;
  icon: LucideIcon;
  formats: {
    from: string[];
    to: string[];
  };
  description: string;
}

const FormatCategory = ({ title, icon: Icon, formats, description }: FormatCategoryProps) => (
  <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border border-gray-100/50">
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-blue-500/10 rounded-xl">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-800 bg-clip-text text-transparent">
        {title}
      </h3>
    </div>
    <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>
    
    <div className="space-y-6">
      <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          Formats source acceptés
        </h4>
        <div className="flex flex-wrap gap-2">
          {formats.from.map((format) => (
            <span key={format} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium">
              {format}
            </span>
          ))}
        </div>
      </div>
      
      <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          Formats de conversion
        </h4>
        <div className="flex flex-wrap gap-2">
          {formats.to.map((format) => (
            <span key={format} className="px-3 py-1.5 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SupportedFormats = () => {
  const formatCategories = [
    {
      title: "Documents",
      icon: FileText,
      description: "Convertissez vos documents entre différents formats de traitement de texte, tableurs et présentations.",
      formats: {
        from: ["PDF", "DOCX", "DOC", "TXT", "RTF", "ODT", "PAGES", "XLSX", "XLS", "CSV", "PPTX", "PPT"],
        to: ["PDF", "DOCX", "DOC", "TXT", "RTF", "ODT", "EPUB", "MOBI", "FB2", "HTML", "MARKDOWN"]
      }
    },
    {
      title: "Images",
      icon: Image,
      description: "Transformez vos images dans tous les formats courants avec conservation de la qualité.",
      formats: {
        from: ["JPG", "JPEG", "PNG", "GIF", "WEBP", "BMP", "TIFF", "SVG", "ICO", "HEIC"],
        to: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF", "SVG", "ICO", "PDF"]
      }
    },
    {
      title: "Vidéos",
      icon: FileVideo,
      description: "Convertissez vos vidéos dans les formats les plus populaires avec options de compression.",
      formats: {
        from: ["MP4", "MOV", "AVI", "MKV", "WMV", "FLV", "WEBM", "3GP", "M4V", "MPEG"],
        to: ["MP4", "MOV", "AVI", "MKV", "WMV", "FLV", "WEBM", "GIF"]
      }
    },
    {
      title: "Audio",
      icon: FileAudio,
      description: "Transformez vos fichiers audio avec préservation de la qualité sonore.",
      formats: {
        from: ["MP3", "WAV", "AAC", "OGG", "FLAC", "M4A", "WMA", "AIFF", "AMR", "OPUS"],
        to: ["MP3", "WAV", "AAC", "OGG", "FLAC", "M4A", "WMA"]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mt-16 mb-16">
          <div className="inline-block p-3 bg-blue-500/10 rounded-2xl mb-6">
            <FileIcon className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Formats Supportés
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Notre convertisseur prend en charge une large gamme de formats pour répondre à tous vos besoins de conversion.
            Découvrez ci-dessous la liste complète des formats supportés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {formatCategories.map((category, index) => (
            <FormatCategory key={index} {...category} />
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-400" />
            Informations Importantes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { icon: FileIcon, title: "Taille maximale", desc: "Limite de 100 MB par fichier" },
              { icon: Shield, title: "Qualité préservée", desc: "Conservation optimale lors de la conversion" },
              { icon: Zap, title: "Conversion rapide", desc: "Traitement ultra-rapide et sécurisé" },
              { icon: Clock, title: "Suppression auto", desc: "Fichiers effacés après 24 heures" }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white/10 rounded-xl backdrop-blur-lg border border-white/5 hover:bg-white/20 transition-colors">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-lg border border-white/5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <p className="text-sm text-gray-300">
                Pour toute question concernant les limitations ou le processus de conversion, 
                n'hésitez pas à consulter notre <a href="#faq" className="text-blue-400 hover:text-blue-300 font-medium">FAQ</a> 
                ou à nous <a href="#contact" className="text-blue-400 hover:text-blue-300 font-medium">contacter</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportedFormats; 