import { useEffect, useRef, useState } from 'react';
import { Download, FileSignature, FileText, Loader2, ScanText } from 'lucide-react';
import FilePreview from '../components/FilePreview';
import { annotatePdf, generateDocument, runLocalOcr } from '../services/documentLab';
import { PdfOutput } from '../services/pdfTools';

type Tab = 'ocr' | 'annotate' | 'generate';

export default function DocumentLab() {
  const [tab, setTab] = useState<Tab>('ocr');
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
  const [annotation, setAnnotation] = useState({ page: 1, text: '', x: 10, y: 15, width: 35, blackout: false });
  const urls = useRef<string[]>([]);

  useEffect(() => { const values = urls.current; return () => values.forEach(URL.revokeObjectURL); }, []);
  const publish = (next: PdfOutput) => { urls.current.forEach(URL.revokeObjectURL); urls.current.splice(0, urls.current.length, next.url); setOutput(next); };

  const run = async () => {
    setBusy(true); setError(''); setOutput(null);
    try {
      if (tab === 'ocr') {
        if (!file) throw new Error('Ajoutez une image ou un PDF.');
        setOcrText(await runLocalOcr(file, ['fr', 'en']));
      } else if (tab === 'annotate') {
        if (!file) throw new Error('Ajoutez un PDF.');
        publish(await annotatePdf({ pdf: file, signature: signature ?? undefined, ...annotation }));
      } else publish(await generateDocument({ title, body, footer, logo, accent: '#111827' }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Opération impossible.'); }
    finally { setBusy(false); }
  };

  const downloadText = () => {
    const url = URL.createObjectURL(new Blob([ocrText], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'texte-extrait.txt'; anchor.click(); URL.revokeObjectURL(url);
  };

  return <main className="flex-grow px-6 pb-20 pt-28"><div className="mx-auto max-w-5xl">
    <div className="mb-8 text-center"><h1 className="text-4xl font-bold tracking-tight">Laboratoire documentaire</h1><p className="mt-3 text-gray-500">OCR local, annotation PDF et création de documents.</p></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {([{id:'ocr',label:'OCR local',icon:ScanText},{id:'annotate',label:'Signer & annoter',icon:FileSignature},{id:'generate',label:'Créer un PDF',icon:FileText}] as const).map(item => <button key={item.id} onClick={() => { setTab(item.id); setFile(null); setOutput(null); setError(''); }} className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-medium ${tab===item.id?'bg-gray-900 text-white':'bg-white'}`}><item.icon size={18}/>{item.label}</button>)}
    </div>
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      {tab !== 'generate' && <><label className="block cursor-pointer rounded-xl border-2 border-dashed p-7 text-center"><input className="hidden" type="file" accept={tab==='ocr'?'image/*,.pdf':'.pdf,application/pdf'} onChange={event => setFile(event.target.files?.[0] ?? null)} /><p className="font-medium">{file ? file.name : tab==='ocr'?'Ajouter une image ou un PDF':'Ajouter le PDF à annoter'}</p></label>{file && <div className="mt-4"><FilePreview file={file}/></div>}</>}
      {tab === 'ocr' && <div className="mt-5"><p className="text-sm text-gray-600">Reconnaissance locale français/anglais. La disponibilité dépend du moteur OCR du navigateur.</p>{ocrText && <><textarea value={ocrText} onChange={event=>setOcrText(event.target.value)} className="mt-3 h-72 w-full rounded-xl border p-4 text-sm"/><button onClick={downloadText} className="mt-2 rounded-lg border px-4 py-2 text-sm font-medium">Télécharger le texte</button></>}</div>}
      {tab === 'annotate' && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Page<input type="number" min="1" value={annotation.page} onChange={event=>setAnnotation(current=>({...current,page:Number(event.target.value)}))} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Texte, date, initiales ou cachet<input value={annotation.text} onChange={event=>setAnnotation(current=>({...current,text:event.target.value}))} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Position horizontale ({annotation.x}%)<input type="range" min="0" max="90" value={annotation.x} onChange={event=>setAnnotation(current=>({...current,x:Number(event.target.value)}))} className="w-full"/></label>
        <label className="text-sm">Position verticale ({annotation.y}%)<input type="range" min="5" max="95" value={annotation.y} onChange={event=>setAnnotation(current=>({...current,y:Number(event.target.value)}))} className="w-full"/></label>
        <label className="text-sm">Largeur ({annotation.width}%)<input type="range" min="10" max="80" value={annotation.width} onChange={event=>setAnnotation(current=>({...current,width:Number(event.target.value)}))} className="w-full"/></label>
        <label className="text-sm">Signature, initiales ou cachet en image<input type="file" accept="image/*" onChange={event=>setSignature(event.target.files?.[0]??null)} className="mt-1 block w-full text-xs"/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={annotation.blackout} onChange={event=>setAnnotation(current=>({...current,blackout:event.target.checked}))}/> Masquer définitivement la zone</label>
        <button type="button" onClick={()=>setAnnotation(current=>({...current,text:new Date().toLocaleDateString('fr-FR')}))} className="rounded-lg border px-3 py-2 text-sm">Insérer la date automatique</button>
      </div>}
      {tab === 'generate' && <div className="grid gap-4">
        <label className="text-sm">Titre<input value={title} onChange={event=>setTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="text-sm">Contenu<textarea value={body} onChange={event=>setBody(event.target.value)} className="mt-1 h-72 w-full rounded-lg border p-3" placeholder="Lettre, facture, reçu, attestation, CV…"/></label>
        <label className="text-sm">Pied de page<input value={footer} onChange={event=>setFooter(event.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="text-sm">Logo<input type="file" accept="image/*" onChange={event=>setLogo(event.target.files?.[0])} className="mt-1 block w-full text-xs"/></label>
      </div>}
      {error && <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button onClick={()=>void run()} disabled={busy || (tab!=='generate'&&!file)} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 font-medium text-white disabled:bg-gray-300">{busy?<><Loader2 size={17} className="animate-spin"/>Traitement…</>:tab==='ocr'?'Extraire le texte':tab==='annotate'?'Générer le PDF annoté':'Créer le PDF'}</button>
      {output && <a href={output.url} download={output.name} className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"><span>{output.name}</span><span className="inline-flex items-center gap-2"><Download size={16}/>Télécharger</span></a>}
    </section>
  </div></main>;
}
