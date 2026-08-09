import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Play, RefreshCw, Share2, Square, Trash2 } from 'lucide-react';
import FilePreview from '../components/FilePreview';
import { convertFile } from '../services/conversionService';
import { cancelActiveMediaConversion } from '../services/mediaConverter';
import { createZip } from '../services/zip';
import { getAvailableOutputFormats, getFileTypeFromExtension } from '../utils/formats';

type Status = 'ready' | 'processing' | 'completed' | 'error' | 'cancelled';
interface Item { id: string; file: File; output: string; customName: string; status: Status; progress: number; url?: string; error?: string; }

export default function BatchManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [naming, setNaming] = useState<'converted'|'original'|'custom'>('converted');
  const cancelled = useRef(false);
  const urls = useRef<string[]>([]);

  useEffect(() => { const values=urls.current; return()=>values.forEach(URL.revokeObjectURL); }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).flatMap(file => {
      const ext=file.name.split('.').pop()?.toLowerCase()??'';
      const formats=getAvailableOutputFormats(ext);
      return formats.length ? [{ id:crypto.randomUUID(), file, output:formats[0].extension, customName:file.name.replace(/\.[^.]+$/,''), status:'ready' as const, progress:0 }] : [];
    });
    setItems(current=>[...current,...next]);
  };

  const outputName = (item: Item) => {
    const base=item.file.name.replace(/\.[^.]+$/,'');
    const name=naming==='original'?base:naming==='custom'?item.customName:`${base}-converti`;
    return `${name}.${item.output}`;
  };

  const convertOne = async (item: Item) => {
    setItems(current=>current.map(value=>value.id===item.id?{...value,status:'processing',progress:0,error:undefined}:value));
    try {
      const url=await convertFile(item.file,item.output,progress=>setItems(current=>current.map(value=>value.id===item.id?{...value,progress}:value)));
      if(cancelled.current){URL.revokeObjectURL(url);setItems(current=>current.map(value=>value.id===item.id?{...value,status:'cancelled'}:value));return;}
      urls.current.push(url);
      setItems(current=>current.map(value=>value.id===item.id?{...value,status:'completed',progress:100,url}:value));
    } catch(error) {
      setItems(current=>current.map(value=>value.id===item.id?{...value,status:cancelled.current?'cancelled':'error',error:error instanceof Error?error.message:'Conversion impossible'}:value));
    }
  };

  const runAll=async()=>{
    setRunning(true);cancelled.current=false;
    const queue=items.filter(item=>item.status==='ready'||item.status==='error'||item.status==='cancelled');
    for(const item of queue){if(cancelled.current)break;await convertOne(item);}
    setRunning(false);
  };
  const cancel=()=>{cancelled.current=true;cancelActiveMediaConversion();setRunning(false);setItems(current=>current.map(item=>item.status==='processing'||item.status==='ready'?{...item,status:'cancelled'}:item));};

  const zip=async()=>{
    const done=items.filter(item=>item.status==='completed'&&item.url);
    const entries=await Promise.all(done.map(async item=>({name:outputName(item),blob:await fetch(item.url!).then(response=>response.blob())})));
    const blob=await createZip(entries);const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='conversions.zip';anchor.click();URL.revokeObjectURL(url);
  };

  const share=async(item:Item)=>{
    if(!item.url)return;const blob=await fetch(item.url).then(response=>response.blob());const file=new File([blob],outputName(item),{type:blob.type});
    if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:outputName(item)});
  };

  return <main className="flex-grow px-6 pb-20 pt-28"><div className="mx-auto max-w-6xl">
    <div className="mb-8 text-center"><h1 className="text-4xl font-bold tracking-tight">Conversions par lot</h1><p className="mt-3 text-gray-500">Mélangez les formats, choisissez chaque sortie et pilotez la file d’attente.</p></div>
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <label className="block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center"><input type="file" multiple className="hidden" onChange={event=>addFiles(event.target.files)}/><p className="font-medium">Ajouter des fichiers compatibles</p><p className="mt-1 text-sm text-gray-500">Images, vidéos, audio et documents peuvent être mélangés.</p></label>
      {items.length>0&&<><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2">{(['converted','original','custom'] as const).map(value=><button key={value} onClick={()=>setNaming(value)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${naming===value?'bg-gray-900 text-white':'bg-white'}`}>{value==='converted'?'nom-original-converti':value==='original'?'Nom original':'Nom personnalisé'}</button>)}</div><button onClick={()=>setItems([])} className="text-sm font-medium text-red-600">Vider la liste</button></div>
      <div className="mt-4 space-y-3">{items.map(item=>{const ext=item.file.name.split('.').pop()?.toLowerCase()??'';const formats=getAvailableOutputFormats(ext);const type=getFileTypeFromExtension(ext);return <article key={item.id} className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[140px_1fr_auto] md:items-center">
        <FilePreview file={item.file} className="h-24"/>
        <div className="min-w-0"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="text-xs text-gray-500">{type} · {(item.file.size/1024/1024).toFixed(2)} MB</p>
          <div className="mt-2 flex flex-wrap gap-2"><select value={item.output} onChange={event=>setItems(current=>current.map(value=>value.id===item.id?{...value,output:event.target.value,status:'ready'}:value))} className="rounded-lg border px-2 py-1.5 text-xs">{formats.map(format=><option key={format.extension} value={format.extension}>{format.name}</option>)}</select>{naming==='custom'&&<input value={item.customName} onChange={event=>setItems(current=>current.map(value=>value.id===item.id?{...value,customName:event.target.value}:value))} className="rounded-lg border px-2 py-1.5 text-xs" />}</div>
          {item.status==='processing'&&<div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-200"><div className="h-full bg-gray-900" style={{width:`${item.progress}%`}}/></div>}{item.error&&<p className="mt-1 text-xs text-red-600">{item.error}</p>}
        </div>
        <div className="flex gap-1">{item.status==='completed'&&item.url&&<><a href={item.url} download={outputName(item)} className="rounded-lg bg-gray-900 p-2 text-white"><Download size={16}/></a>{navigator.share&&<button onClick={()=>void share(item)} className="rounded-lg border p-2"><Share2 size={16}/></button>}</>}{(item.status==='error'||item.status==='cancelled')&&<button onClick={()=>void convertOne(item)} className="rounded-lg border p-2"><RefreshCw size={16}/></button>}<button onClick={()=>setItems(current=>current.filter(value=>value.id!==item.id))} className="rounded-lg border p-2 text-red-600"><Trash2 size={16}/></button></div>
      </article>;})}</div>
      <div className="mt-5 flex flex-wrap gap-2">{running?<button onClick={cancel} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 p-3 font-medium text-white"><Square size={16}/>Annuler</button>:<button onClick={()=>void runAll()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 p-3 font-medium text-white"><Play size={16}/>Convertir la file</button>}{items.some(item=>item.status==='completed')&&<button onClick={()=>void zip()} className="rounded-xl border px-5 py-3 font-medium">Télécharger en ZIP</button>}</div>
      {running&&<p className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={15} className="animate-spin"/>Traitement séquentiel pour protéger la mémoire de l’appareil.</p>}</>}
    </section>
  </div></main>;
}
