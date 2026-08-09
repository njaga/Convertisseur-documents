import { useEffect, useState } from 'react';
import { Download, History, Share2, Trash2 } from 'lucide-react';
import { clearHistory, deleteHistory, HistoryEntry, listHistory } from '../services/history';

export default function HistoryPage(){
  const [entries,setEntries]=useState<HistoryEntry[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;listHistory().then(values=>{if(active)setEntries(values)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  const download=(entry:HistoryEntry)=>{const url=URL.createObjectURL(entry.blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=entry.name;anchor.click();URL.revokeObjectURL(url)};
  const share=async(entry:HistoryEntry)=>{const file=new File([entry.blob],entry.name,{type:entry.type});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:entry.name})};
  const remove=async(id:string)=>{await deleteHistory(id);setEntries(current=>current.filter(entry=>entry.id!==id))};
  const clear=async()=>{await clearHistory();setEntries([])};
  return <main className="flex-grow px-6 pb-20 pt-28"><div className="mx-auto max-w-4xl">
    <div className="mb-8 text-center"><History className="mx-auto mb-3" size={28}/><h1 className="text-4xl font-bold tracking-tight">Historique local</h1><p className="mt-3 text-gray-500">Les résultats sont conservés uniquement sur cet appareil pendant 7 jours.</p></div>
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{entries.length} fichier{entries.length>1?'s':''}</h2>{entries.length>0&&<button onClick={()=>void clear()} className="text-sm font-medium text-red-600">Supprimer toutes mes données</button>}</div>
      {loading?<p className="text-sm text-gray-500">Chargement…</p>:entries.length===0?<p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Aucune conversion conservée.</p>:<div className="space-y-3">{entries.map(entry=><article key={entry.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{entry.name}</p><p className="text-xs text-gray-500">{entry.operation} · {new Date(entry.createdAt).toLocaleString('fr-FR')} · {(entry.size/1024/1024).toFixed(2)} MB</p></div>
        <div className="flex gap-2"><button onClick={()=>download(entry)} className="rounded-lg bg-gray-900 p-2 text-white" aria-label="Télécharger"><Download size={16}/></button>{'share' in navigator&&<button onClick={()=>void share(entry)} className="rounded-lg border p-2" aria-label="Partager"><Share2 size={16}/></button>}<button onClick={()=>void remove(entry.id)} className="rounded-lg border p-2 text-red-600" aria-label="Supprimer"><Trash2 size={16}/></button></div>
      </article>)}</div>}
    </section>
  </div></main>
}
