import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileArchive,
  FileText,
  Image,
  Music,
  Search,
  Server,
  ShieldCheck,
  Video,
} from 'lucide-react';
import {
  conversionMatrix,
  inputFormats,
  isConversionSupported,
  officeInputFormats,
} from '../utils/formats';
import { isOfficeConverterConfigured } from '../services/officeConverter';
import { FileType } from '../types/converter';

const labels: Record<string, string> = {
  png: 'PNG', jpg: 'JPG', jpeg: 'JPEG', webp: 'WebP', ico: 'ICO',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI', mkv: 'MKV', webm: 'WebM', gif: 'GIF',
  mp3: 'MP3', wav: 'WAV', ogg: 'OGG', flac: 'FLAC', m4a: 'M4A', aac: 'AAC',
  txt: 'TXT', md: 'Markdown', html: 'HTML',
  doc: 'DOC', docx: 'DOCX', xls: 'XLS', xlsx: 'XLSX', ppt: 'PPT', pptx: 'PPTX',
  odt: 'ODT', ods: 'ODS', odp: 'ODP', pdf: 'PDF',
};

const categories: Array<{ key: FileType; title: string; icon: typeof Image; description: string }> = [
  { key: 'image', title: 'Images', icon: Image, description: 'Conversions réalisées dans le navigateur.' },
  { key: 'video', title: 'Vidéo', icon: Video, description: 'Conversion locale avec FFmpeg WebAssembly.' },
  { key: 'audio', title: 'Audio', icon: Music, description: 'Conversion locale avec FFmpeg WebAssembly.' },
  { key: 'document', title: 'Texte', icon: FileText, description: 'TXT, Markdown et HTML traités localement.' },
];

const pdfTools = [
  { to: '/modifier-pdf', label: 'Modifier PDF' },
  { to: '/fusionner-pdf', label: 'Fusionner PDF' },
  { to: '/diviser-pdf', label: 'Diviser PDF' },
  { to: '/compresser-pdf', label: 'Compresser PDF' },
  { to: '/signer-pdf', label: 'Signer PDF' },
  { to: '/formulaires-pdf', label: 'Formulaires PDF' },
  { to: '/organiser-pdf', label: 'Organiser PDF' },
  { to: '/pdf-en-png', label: 'PDF en PNG' },
  { to: '/images-en-pdf', label: 'Images en PDF' },
];

const localDocumentFormats = ['txt', 'md', 'html'];

const SupportedFormats = () => {
  const [query, setQuery] = useState('');
  const officeConfigured = isOfficeConverterConfigured();
  const officeEnabled = officeConfigured && officeInputFormats.every(format => isConversionSupported(format, 'pdf'));
  const normalizedQuery = query.trim().toLowerCase();

  const localPairsCount = useMemo(
    () => Object.values(conversionMatrix).reduce((total, outputs) => total + outputs.length, 0),
    []
  );

  const visibleCategories = useMemo(() => categories.map(category => {
    const sources = category.key === 'document'
      ? localDocumentFormats
      : inputFormats[category.key];

    const rows = sources
      .map(source => ({ source, outputs: conversionMatrix[source] ?? [] }))
      .filter(({ source, outputs }) => {
        if (!normalizedQuery) return true;
        const haystack = [source, labels[source], ...outputs, ...outputs.map(output => labels[output])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

    return { ...category, rows };
  }).filter(category => category.rows.length > 0), [normalizedQuery]);

  const officeRows = officeInputFormats.filter(format => {
    if (!normalizedQuery) return true;
    return `${format} ${labels[format]} pdf`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-28 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-[#2457E6]">Compatibilité</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Formats pris en charge</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Doxali n’affiche que les conversions réellement disponibles. Les traitements locaux restent prioritaires ; les documents Office ne passent par un service distant que si ce moteur est configuré.
          </p>
        </header>

        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <div className="bg-white p-5">
            <ShieldCheck size={20} className="text-[#2457E6]" />
            <p className="mt-3 text-sm font-semibold">Local-first</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Images, audio, vidéo, texte et outils PDF sont traités sur l’appareil quand le navigateur le permet.</p>
          </div>
          <div className="bg-white p-5">
            <CheckCircle2 size={20} className="text-[#2457E6]" />
            <p className="mt-3 text-sm font-semibold">{localPairsCount} conversions locales</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">La matrice source → destination est limitée aux moteurs effectivement implémentés.</p>
          </div>
          <div className="bg-white p-5">
            <Server size={20} className={officeEnabled ? 'text-[#2457E6]' : 'text-slate-400'} />
            <p className="mt-3 text-sm font-semibold">Office → PDF</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {officeEnabled ? 'Disponible sur ce déploiement.' : 'Moteur serveur non activé sur ce déploiement.'}
            </p>
          </div>
        </div>

        <div className="relative mt-10 max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Rechercher PNG, MP4, DOCX, PDF…"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#2457E6] focus:ring-2 focus:ring-[#2457E6]/10"
          />
        </div>

        <div className="mt-8 space-y-8">
          {visibleCategories.map(category => {
            const Icon = category.icon;
            return (
              <section key={category.key} className="border-t border-slate-200 pt-6">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FF] text-[#2457E6]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{category.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  {category.rows.map(({ source, outputs }, index) => (
                    <div key={source} className={`grid gap-3 p-4 sm:grid-cols-[130px_1fr] sm:items-center ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                      <div>
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                          {labels[source] ?? source.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ArrowRight size={14} className="mr-1 hidden text-slate-300 sm:block" />
                        {outputs.map(output => (
                          <span key={output} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
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

          {(officeRows.length > 0 || !normalizedQuery) && (
            <section className="border-t border-slate-200 pt-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileArchive size={19} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">Documents Office</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${officeEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {officeEnabled ? 'Disponible' : 'Optionnel'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Conversion vers PDF via le service LibreOffice sécurisé lorsqu’il est activé.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {officeRows.map(format => (
                  <span key={format} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold">{labels[format]}</span>
                    <ArrowRight size={13} className="text-slate-300" />
                    <span>PDF</span>
                  </span>
                ))}
              </div>
              {!officeEnabled && (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Ces formats ne sont proposés dans le convertisseur que lorsqu’une URL de conversion Office est configurée. Aucun bouton trompeur n’est affiché sinon.
                </p>
              )}
            </section>
          )}

          {!visibleCategories.length && !officeRows.length && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Aucun format ne correspond à « {query} ».
            </div>
          )}
        </div>

        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">Outils PDF dédiés</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le PDF ne se limite pas à une conversion de format : Doxali propose des outils dédiés pour modifier, organiser, signer, compresser ou transformer vos documents.
            </p>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {pdfTools.map(tool => (
              <Link key={tool.to} to={tool.to} className="group flex items-center justify-between gap-3 bg-white px-4 py-4 text-sm font-medium transition hover:bg-[#F8FAFF] hover:text-[#2457E6]">
                {tool.label}
                <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2457E6]" />
              </Link>
            ))}
          </div>
        </section>

        <aside className="mt-10 rounded-lg bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          <strong className="text-slate-900">À savoir :</strong> la limite d’interface est actuellement de 100 MB par fichier. Les traitements lourds, notamment vidéo et gros PDF, dépendent de la mémoire et de la puissance de votre appareil. La disponibilité Office est détectée séparément du reste des conversions.
        </aside>
      </div>
    </main>
  );
};

export default SupportedFormats;
