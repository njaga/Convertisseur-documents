import { Image, Video, Music, FileText, ArrowRight } from 'lucide-react';
import { conversionMatrix, inputFormats } from '../utils/formats';
import { FileType } from '../types/converter';

const labels: Record<string, string> = {
  png: 'PNG', jpg: 'JPG', jpeg: 'JPEG', webp: 'WebP',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI', mkv: 'MKV', webm: 'WebM', gif: 'GIF',
  mp3: 'MP3', wav: 'WAV', ogg: 'OGG', flac: 'FLAC', m4a: 'M4A', aac: 'AAC',
  txt: 'TXT', md: 'Markdown', html: 'HTML',
};

const categories: Array<{ key: FileType; title: string; icon: typeof Image; description: string }> = [
  { key: 'image', title: 'Images', icon: Image, description: 'Canvas API, traitement local' },
  { key: 'video', title: 'Videos', icon: Video, description: 'FFmpeg WebAssembly, traitement local' },
  { key: 'audio', title: 'Audio', icon: Music, description: 'FFmpeg WebAssembly, traitement local' },
  { key: 'document', title: 'Texte', icon: FileText, description: 'Conversion locale TXT / Markdown / HTML' },
];

const SupportedFormats = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Conversions supportees</h1>
          <p className="text-gray-500 mt-2">
            Cette page liste uniquement les conversions réellement disponibles dans l'application.
          </p>
        </div>

        <div className="space-y-4">
          {categories.map(category => {
            const Icon = category.icon;
            const sources = inputFormats[category.key];

            return (
              <section key={category.key} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{category.title}</h2>
                    <p className="text-xs text-gray-400">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sources.map(source => (
                    <div key={source} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
                      <span className="w-24 font-semibold text-gray-900">{labels[source] ?? source.toUpperCase()}</span>
                      <ArrowRight size={14} className="hidden sm:block text-gray-300" />
                      <div className="flex flex-wrap gap-2">
                        {(conversionMatrix[source] ?? []).map(output => (
                          <span key={output} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                            {labels[output] ?? output.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Confidentialite et limites</h3>
          <ul className="space-y-1.5 text-sm text-gray-500">
            <li>- Les conversions actuelles sont effectuees localement dans votre navigateur.</li>
            <li>- La taille maximale acceptee par l'interface est de 100 MB.</li>
            <li>- Les performances dependent de votre appareil, surtout pour la video.</li>
            <li>- Les conversions PDF et Office reviendront lorsqu'un moteur serveur securise sera disponible.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupportedFormats;
