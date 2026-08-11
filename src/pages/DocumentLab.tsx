import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Accept } from 'react-dropzone';
import { CalendarDays, Download, FileSignature, FileText, ImagePlus, Loader2, ScanText } from 'lucide-react';
import FileDropZone from '../components/FileDropZone';
import FilePreview from '../components/FilePreview';
import PdfAnnotationEditor from '../components/PdfAnnotationEditor';
import ResultPreview from '../components/ResultPreview';
import { annotatePdf, generateDocument, runLocalOcr } from '../services/documentLab';
import { PdfOutput } from '../services/pdfTools';
import { PdfAnnotationState } from '../types/documentLab';

type Tab = 'ocr' | 'annotate' | 'generate';

const tabs = [
  { id: 'ocr', path: '/ocr-pdf', label: 'OCR local', title: 'OCR PDF et images', description: 'Extrayez du texte depuis un PDF ou une image directement dans votre navigateur.', icon: ScanText },
  { id: 'annotate', path: '/signer-pdf', label: 'Signer & annoter', title: 'Signer et annoter un PDF', description: 'Ajoutez une signature, une date, du texte ou masquez une zone avec un placement visuel précis.', icon: FileSignature },
  { id: 'generate', path: '/creer-pdf', label: 'Créer un PDF', title: 'Créer un document PDF', description: 'Rédigez un document simple, ajoutez un logo et exportez-le immédiatement en PDF.', icon: FileText },
] as const;

const pathToTab = new Map<string, Tab>(tabs.map(item => [item.path, item.id]));
const ocrAccept: Accept = { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] };
const pdfAccept: Accept = { 'application/pdf': ['.pdf'] };

const initialAnnotation: PdfAnnotationState = {
  page: 1,
  text: '',
  x: 10,
  y: 15,
  width: 35,
  blackout: false,
  signatureX: 58,
  signatureY: 68,
  signatureWidth: 28,
};

export default function DocumentLab() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: Tab = pathToTab.get(location.pathname) ?? 'ocr';
  const tabInfo = tabs.find(item => item.id === tab) ?? tabs[0];

  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [output, setOutput] = useState<PdfOutput | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('Nouveau document');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [logo, setLogo] = useState<File | undefined>();
  const [annotation, setAnnotation] = useState<PdfAnnotationState>(initialAnnotation);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const values = urls.current;
    return () => values.forEach(URL.revokeObjectURL);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const existingMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const meta = existingMeta ?? document.head.appendChild(document.createElement('meta'));
    const previousDescription = meta.getAttribute('content');
    if (!existingMeta) meta.name = 'description';

    const existingCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonical = existingCanonical ?? document.head.appendChild(document.createElement('link'));
    const previousCanonical = canonical.getAttribute('href');
    if (!existingCanonical) canonical.rel = 'canonical';

    document.title = `${tabInfo.title} gratuitement | Doxali`;
    meta.setAttribute('content', `${tabInfo.description} Sans compte et sans quota quotidien.`);
    canonical.setAttribute('href', `${window.location.origin}${tabInfo.path}`);

    return () => {
      document.title = previousTitle;
      if (existingMeta) {
        if (previousDescription === null) meta.removeAttribute('content');
        else meta.setAttribute('content', previousDescription);
      } else meta.remove();
      if (existingCanonical) {
        if (previousCanonical === null) canonical.removeAttribute('href');
        else canonical.setAttribute('href', previousCanonical);
      } else canonical.remove();
    };
  }, [tabInfo]);

  const clearOutput = () => {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current.length = 0;
    setOutput(null);
  };

  const publish = (next: PdfOutput) => {
    clearOutput();
    urls.current.push(next.url);
    setOutput(next);
  };

  const changeTab = (next: Tab) => {
    clearOutput();
    setFile(null);
    setSignature(null);
    setError('');
    setOcrText('');
    setAnnotation(initialAnnotation);
    navigate(tabs.find(item => item.id === next)?.path ?? '/ocr-pdf');
  };

  const selectFile = (files: File[]) => {
    clearOutput();
    setError('');
    setFile(files[0] ?? null);
    setAnnotation(current => ({ ...current, page: 1 }));
  };

  const run = async () => {
    setBusy(true);
    setError('');
    clearOutput();
    try {
      if (tab === 'ocr') {
        if (!file) throw new Error('Ajoutez une image ou un PDF.');
        setOcrText(await runLocalOcr(file, ['fr', 'en']));
      } else if (tab === 'annotate') {
        if (!file) throw new Error('Ajoutez un PDF.');
        publish(await annotatePdf({ pdf: file, signature: signature ?? undefined, ...annotation }));
      } else {
        publish(await generateDocument({ title, body, footer, logo, accent: '#111827' }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Opération impossible.');
    } finally {
      setBusy(false);
    }
  };

  const downloadText = () => {
    const url = URL.createObjectURL(new Blob([ocrText], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'texte-extrait.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-grow bg-[#f7f8fb] px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">{tabInfo.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">{tabInfo.description}</p>
        </header>

        <nav className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Outils documentaires">
          {tabs.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeTab(item.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-medium transition ${tab === item.id ? 'border-gray-950 bg-gray-950 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          {tab !== 'generate' && !file && (
            <FileDropZone
              onFiles={selectFile}
              accept={tab === 'ocr' ? ocrAccept : pdfAccept}
              title={tab === 'ocr' ? 'Sélectionner une image ou un PDF' : 'Sélectionner le PDF à signer'}
              hint={tab === 'ocr' ? 'ou glissez-déposez votre fichier ici' : 'ou glissez-déposez votre PDF ici · 150 MB max.'}
            />
          )}

          {file && tab !== 'generate' && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => { setFile(null); setSignature(null); clearOutput(); }} className="text-sm font-medium text-blue-600 hover:text-blue-700">Changer de fichier</button>
            </div>
          )}

          {tab === 'ocr' && file && (
            <div>
              <div className="mx-auto max-w-3xl"><FilePreview file={file} /></div>
              <p className="mt-5 text-sm text-gray-600">Reconnaissance locale français/anglais. Le document reste sur votre appareil quand le moteur OCR natif est disponible.</p>
              {ocrText && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-semibold text-gray-900">Texte extrait</h2><button type="button" onClick={downloadText} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium">Télécharger en TXT</button></div>
                  <textarea value={ocrText} onChange={event => setOcrText(event.target.value)} className="h-72 w-full rounded-xl border border-gray-200 p-4 text-sm leading-6 focus:border-gray-400 focus:outline-none" />
                </div>
              )}
            </div>
          )}

          {tab === 'annotate' && file && (
            <div>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <label className="text-sm font-medium text-gray-700">
                  Texte, date ou initiales
                  <input value={annotation.text} onChange={event => setAnnotation(current => ({ ...current, text: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal" placeholder="Facultatif" />
                </label>
                <button type="button" onClick={() => setAnnotation(current => ({ ...current, text: new Date().toLocaleDateString('fr-FR') }))} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium"><CalendarDays size={16} /> Insérer la date</button>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Signature, initiales ou cachet</p>
                    <p className="mt-1 text-xs text-gray-500">PNG/JPG recommandé, idéalement avec fond transparent.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">
                    <ImagePlus size={16} /> {signature ? 'Remplacer l’image' : 'Ajouter une image'}
                    <input type="file" accept="image/*" className="hidden" onChange={event => setSignature(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
                {signature && <p className="mt-3 truncate text-xs font-medium text-blue-800">{signature.name}</p>}
              </div>

              <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">Réglages du texte et de la zone de masquage</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="text-xs text-gray-600">Position horizontale · {annotation.x}%<input type="range" min="0" max="90" value={annotation.x} onChange={event => setAnnotation(current => ({ ...current, x: Number(event.target.value) }))} className="mt-2 w-full" /></label>
                  <label className="text-xs text-gray-600">Position verticale · {annotation.y}%<input type="range" min="2" max="95" value={annotation.y} onChange={event => setAnnotation(current => ({ ...current, y: Number(event.target.value) }))} className="mt-2 w-full" /></label>
                  <label className="text-xs text-gray-600">Largeur · {annotation.width}%<input type="range" min="10" max="80" value={annotation.width} onChange={event => setAnnotation(current => ({ ...current, width: Number(event.target.value) }))} className="mt-2 w-full" /></label>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={annotation.blackout} onChange={event => setAnnotation(current => ({ ...current, blackout: event.target.checked }))} /> Masquer définitivement cette zone</label>
              </details>

              <PdfAnnotationEditor
                key={`${file.name}-${file.size}-${file.lastModified}`}
                file={file}
                signature={signature}
                annotation={annotation}
                onChange={setAnnotation}
                onRemoveSignature={() => setSignature(null)}
              />
            </div>
          )}

          {tab === 'generate' && (
            <div className="grid gap-4">
              <label className="text-sm font-medium text-gray-700">Titre<input value={title} onChange={event => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 font-normal" /></label>
              <label className="text-sm font-medium text-gray-700">Contenu<textarea value={body} onChange={event => setBody(event.target.value)} className="mt-1.5 h-72 w-full rounded-xl border border-gray-200 p-3 font-normal leading-6" placeholder="Lettre, reçu, attestation, note…" /></label>
              <label className="text-sm font-medium text-gray-700">Pied de page<input value={footer} onChange={event => setFooter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 font-normal" /></label>
              <label className="text-sm font-medium text-gray-700">Logo<input type="file" accept="image/*" onChange={event => setLogo(event.target.files?.[0])} className="mt-1.5 block w-full rounded-xl border border-gray-200 p-3 text-xs font-normal" /></label>
            </div>
          )}

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          {(tab === 'generate' || file) && (
            <button onClick={() => void run()} disabled={busy} className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300">
              {busy ? <><Loader2 size={17} className="animate-spin" /> Traitement…</> : tab === 'ocr' ? 'Extraire le texte' : tab === 'annotate' ? 'Appliquer et générer le PDF' : 'Créer le PDF'}
            </button>
          )}

          {output && (
            <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-semibold text-gray-900">Résultat prêt</h2><p className="mt-1 text-xs text-gray-500">Vérifiez le résultat avant de le télécharger.</p></div>
                <a href={output.url} download={output.name} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white"><Download size={16} /> Télécharger</a>
              </div>
              <ResultPreview url={output.url} name={output.name} />
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
