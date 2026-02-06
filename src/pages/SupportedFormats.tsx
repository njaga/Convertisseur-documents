import { Image, Video, Music, FileText } from 'lucide-react';
import { supportedFormats } from '../utils/formats';

const SupportedFormats = () => {
  const categories = [
    {
      key: 'image' as const,
      title: 'Images',
      icon: Image,
      description: 'Conversion locale via Canvas API'
    },
    {
      key: 'video' as const,
      title: 'Videos',
      icon: Video,
      description: 'Conversion via FFmpeg WebAssembly'
    },
    {
      key: 'audio' as const,
      title: 'Audio',
      icon: Music,
      description: 'Conversion via FFmpeg WebAssembly'
    },
    {
      key: 'document' as const,
      title: 'Documents',
      icon: FileText,
      description: 'Conversion entre formats texte'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Formats supportes
          </h1>
          <p className="text-gray-500 mt-2">
            Tous les formats sont convertis localement sur votre appareil
          </p>
        </div>

        {/* Format Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
            const formats = supportedFormats[category.key];
            const Icon = category.icon;

            return (
              <div
                key={category.key}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{category.title}</h2>
                    <p className="text-xs text-gray-400">{category.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formats.map((format) => (
                    <span
                      key={format.extension}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                    >
                      {format.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Informations</h3>
          <ul className="space-y-1.5 text-sm text-gray-500">
            <li>- Traitement 100% local (aucun upload)</li>
            <li>- Aucune limite de taille</li>
            <li>- Conversions illimitees</li>
            <li>- Respect de la vie privee</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupportedFormats;