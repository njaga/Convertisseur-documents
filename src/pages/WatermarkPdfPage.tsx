import { useEffect, useRef, useState } from 'react';
import type { Accept } from 'react-dropzone';
import { Download, Image as ImageIcon, Loader2, ShieldCheck, Stamp, Type, X } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import ResultPreview from '../components/ResultPreview';
import { saveHistoryFromUrl } from '../services/history';
import { createPdfPagePreviews, type PdfPagePreview, type PdfOutput } from '../services/pdfTools';
import {
  addWatermarkToPdf,
  type WatermarkMode,
  type WatermarkScope,
} from '../services/watermark';

const pdfAccept: Accept = { 'application/pdf': ['.pdf'] };

const positions = [
  { x: 20, y: 20 }, { x: 50, y: 20 }, { x: 80, y: 20 },
  { x: 20, y: 50 }, { x: 50, y: 50 }, { x: 80, y: 50 },
  { x: 20, y: 80 }, { x: 50, y: 80 }, { x: 80, y: 80 },
];

export default function WatermarkPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<WatermarkMode>('text');
  const [text, setText] = useState('CONFIDENTIEL');
  const [image, setImage] = useState<File | undefined>();
  const [imageUrl, setImageUrl] = useState('');
  const [opacity, setOpacity] = useState(22);
  const [rotation, setRotation] = useState(-35);
  const [size, setSize] = useState(12);
  const [color, setColor] = useState('#6b7280');
  const [tiled, setTiled] = useState(false);
  const [scope, setScope] = useState<WatermarkScope>('all');
  const [pages, setPages] = useState('');
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const previewUrls = useRef<string[]>([]);
  const outputUrl = useRef('');
  const imagePreviewUrl = useRef('');

  const clearOutput = () => {
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = '';
    setOutput(null);
  };

  const clearPreviews = () => {
    previewUrls.current.forEach(URL.revokeObjectURL);
    previewUrls.current = [];
    setPreviews([]);
  };

  useEffect(() => () => {
    previewUrls.current.forEach(URL.revokeObjectURL);
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
  }, []);

  const selectWatermarkImage = (selected?: File) => {
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
    imagePreviewUrl.current = selected ? URL.createObjectURL(selected) : '';
    setImage(selected);
    setImageUrl(imagePreviewUrl.current);
    clearOutput();
  };

  const selectPdf = (files: File[]) => {
    clearOutput();
    clearPreviews();
    setError('');
    const selected = files[0] ?? null;
    setFile(selected);
    setPages('');
    if (!selected) return;

    setLoadingPreview(true);
    createPdfPagePreviews([selected], 0.85)
      .then(next => {
        previewUrls.current.push(...next.map(preview => preview.url));
        setPreviews(next);
      })
      .catch(caught => setError(caught instanceof Error ? caught.message : 'Impossible de générer l’aperçu du PDF.'))
      .finally(() => setLoadingPreview(false));
  };

  const changeMode = (next: WatermarkMode) => {
    clearOutput();
    setMode(next);
    setSize(next === 'image' ? 28 : 12);
  };

  const generate = async () => {
    if (!file) return;
    clearOutput();
    setProcessing(true);
    setError('');
    try {
      const result = await addWatermarkToPdf(file, {
        mode,
        text,
        image,
        opacity,
        rotation,
        size,
        tiled,
        scope,
        pages,
        color,
      });
      outputUrl.current = result.url;
      setOutput(result);
      await saveHistoryFromUrl(result.name, 'Ajout de filigrane PDF', result.url).catch(() => undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible d’ajouter le filigrane.');
    } finally {
      setProcessing(false);
    }
  };

  const previewPositions = tiled ? positions : [{ x: 50, y: 50 }];
  const canGenerate = Boolean(file && (mode === 'text' ? text.trim() : image) && (scope !== 'custom' || pages.trim()));

  return (
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            <ShieldCheck size={14} /> Traitement local, sans envoi vers un serveur
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">Ajouter un filigrane à un PDF</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            Ajoutez un texte, un logo ou un cachet en filigrane, réglez son opacité et son inclinaison puis appliquez-le aux pages de votre choix.
          </p>
        </header>

        {!file && (
          <div className="mx-auto max-w-3xl">
            <FileDropZone onFiles={selectPdf} accept={pdfAccept} title="Sélectionner le PDF" hint="ou glissez-déposez votre fichier ici · PDF uniquement" />
          </div>
        )}

        {file && (
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-950">{file.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{previews.length || '…'} page{previews.length > 1 ? 's' : ''}</p>
                </div>
                <button type="button" onClick={() => selectPdf([])} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Retirer le PDF"><X size={16} /></button>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Type de filigrane</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => changeMode('text')} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${mode === 'text' ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-700'}`}><Type size={16} /> Texte</button>
                  <button type="button" onClick={() => changeMode('image')} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${mode === 'image' ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-700'}`}><ImageIcon size={16} /> Image / logo</button>
                </div>
              </div>

              {mode === 'text' ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <label className="text-sm font-medium text-gray-700">
                    Texte
                    <input value={text} onChange={event => { setText(event.target.value); clearOutput(); }} maxLength={80} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none" placeholder="Ex. CONFIDENTIEL" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Couleur
                    <input type="color" value={color} onChange={event => { setColor(event.target.value); clearOutput(); }} className="mt-1.5 block h-12 w-20 cursor-pointer rounded-xl border border-gray-200 bg-white p-1" />
                  </label>
                </div>
              ) : (
                <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center hover:border-gray-400">
                  <ImageIcon className="mx-auto text-gray-400" size={24} />
                  <span className="mt-2 block text-sm font-semibold text-gray-800">{image ? image.name : 'Choisir un logo, cachet ou image'}</span>
                  <span className="mt-1 block text-xs text-gray-500">PNG, JPG, WebP… La transparence PNG est conservée.</span>
                  <input type="file" accept="image/*,.png,.jpg,.jpeg,.webp" className="hidden" onChange={event => { selectWatermarkImage(event.target.files?.[0]); event.target.value = ''; }} />
                </label>
              )}

              <div className="mt-6 grid gap-5">
                <label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center justify-between"><span>Opacité</span><strong>{opacity}%</strong></span>
                  <input type="range" min="5" max="100" value={opacity} onChange={event => { setOpacity(Number(event.target.value)); clearOutput(); }} className="mt-2 w-full" />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center justify-between"><span>Rotation</span><strong>{rotation}°</strong></span>
                  <input type="range" min="-90" max="90" step="5" value={rotation} onChange={event => { setRotation(Number(event.target.value)); clearOutput(); }} className="mt-2 w-full" />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center justify-between"><span>Taille</span><strong>{size}%</strong></span>
                  <input type="range" min="5" max={mode === 'text' ? 22 : 60} value={size} onChange={event => { setSize(Number(event.target.value)); clearOutput(); }} className="mt-2 w-full" />
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input type="checkbox" checked={tiled} onChange={event => { setTiled(event.target.checked); clearOutput(); }} className="mt-1 h-4 w-4" />
                <span><strong className="block text-sm text-gray-900">Répéter le filigrane sur la page</strong><span className="mt-1 block text-xs leading-5 text-gray-500">Utile pour les documents confidentiels difficiles à recadrer ou copier sans marquage.</span></span>
              </label>

              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-900">Pages concernées</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {([
                    ['all', 'Toutes'],
                    ['first', 'Première'],
                    ['custom', 'Personnalisées'],
                  ] as Array<[WatermarkScope, string]>).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => { setScope(value); clearOutput(); }} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${scope === value ? 'border-[#2457E6] bg-blue-50 text-[#2457E6]' : 'border-gray-200 text-gray-700'}`}>{label}</button>
                  ))}
                </div>
                {scope === 'custom' && (
                  <label className="mt-3 block text-xs font-medium text-gray-600">
                    Numéros de pages
                    <input value={pages} onChange={event => { setPages(event.target.value); clearOutput(); }} placeholder="Ex. 1,3,5-8" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none" />
                  </label>
                )}
              </div>

              {error && <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <button type="button" disabled={!canGenerate || processing} onClick={() => void generate()} className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
                {processing ? <><Loader2 size={18} className="animate-spin" /> Ajout du filigrane…</> : <><Stamp size={18} /> Ajouter le filigrane</>}
              </button>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><h2 className="font-semibold text-gray-950">Aperçu</h2><p className="mt-1 text-xs text-gray-500">Simulation sur la première page. Le rendu final utilise les mêmes réglages.</p></div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Page 1</span>
                </div>

                {loadingPreview ? (
                  <div className="flex min-h-[34rem] items-center justify-center gap-2 rounded-2xl bg-gray-100 text-sm text-gray-500"><Loader2 size={17} className="animate-spin" /> Génération de l’aperçu…</div>
                ) : previews[0] ? (
                  <div className="flex justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 p-4">
                    <div className="relative max-h-[44rem] max-w-full overflow-hidden bg-white shadow-sm">
                      <img src={previews[0].url} alt="Aperçu de la première page du PDF" className="block max-h-[44rem] max-w-full object-contain" />
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {previewPositions.map((position, index) => mode === 'text' ? (
                          <span
                            key={`${position.x}-${position.y}-${index}`}
                            className="absolute whitespace-nowrap font-bold"
                            style={{
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                              color,
                              opacity: opacity / 100,
                              fontSize: `${Math.max(14, size * 3.2)}px`,
                              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                              transformOrigin: 'center',
                            }}
                          >
                            {text || 'FILIGRANE'}
                          </span>
                        ) : imageUrl ? (
                          <img
                            key={`${position.x}-${position.y}-${index}`}
                            src={imageUrl}
                            alt=""
                            className="absolute h-auto"
                            style={{
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                              width: `${size}%`,
                              opacity: opacity / 100,
                              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                              transformOrigin: 'center',
                            }}
                          />
                        ) : null)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">Aperçu indisponible.</p>
                )}
              </section>

              {output && (
                <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="font-semibold text-gray-950">PDF prêt</h2><p className="mt-1 text-xs text-gray-500">Le résultat a aussi été ajouté à l’historique local.</p></div>
                    <a href={output.url} download={output.name} className="inline-flex items-center gap-2 rounded-xl bg-[#2457E6] px-4 py-2.5 text-sm font-semibold text-white"><Download size={16} /> Télécharger</a>
                  </div>
                  <ResultPreview url={output.url} name={output.name} />
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
