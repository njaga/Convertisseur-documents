import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Download, FileClock, History, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  clearHistory,
  deleteHistory,
  type HistoryEntry,
  listHistory,
  subscribeHistory,
} from '../services/history';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await listHistory());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de lire l’historique local.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribeHistory(() => void reload());
  }, [reload]);

  const download = (entry: HistoryEntry) => {
    const url = URL.createObjectURL(entry.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = entry.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async (entry: HistoryEntry) => {
    const file = new File([entry.blob], entry.name, { type: entry.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: entry.name });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteHistory(id);
      setEntries(current => current.filter(entry => entry.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de supprimer ce fichier.');
    }
  };

  const clear = async () => {
    try {
      await clearHistory();
      setEntries([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de vider l’historique.');
    }
  };

  return (
    <main className="flex-grow bg-gray-50 px-6 pb-20 pt-28">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2457E6]">
            <History size={20} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">Historique local</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Les résultats enregistrés par Doxali restent sur cet appareil. Ils sont supprimés automatiquement après 7 jours et ne nécessitent aucun compte.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {entries.length} fichier{entries.length > 1 ? 's' : ''}
              </h2>
              <p className="mt-1 text-xs text-gray-500">Conversions et résultats PDF récents sur ce navigateur.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void reload()} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2457E6] hover:text-[#1e49c4]">
                <RefreshCw size={14} /> Actualiser
              </button>
              {entries.length > 0 && (
                <button type="button" onClick={() => void clear()} className="text-left text-sm font-medium text-red-600 hover:text-red-700">
                  Supprimer tout l’historique
                </button>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Historique indisponible</p>
                <p className="mt-1 leading-6">{error}</p>
              </div>
            </div>
          )}

          {loading && <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Chargement de l’historique…</p>}

          {!loading && !error && entries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <FileClock className="mx-auto text-gray-400" size={28} />
              <h3 className="mt-3 font-semibold text-gray-900">Aucun résultat enregistré pour le moment</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Les prochains fichiers générés par le convertisseur, les outils PDF, la compression, la signature et les autres outils compatibles apparaîtront ici automatiquement.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link to="/modifier-pdf" className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Modifier un PDF</Link>
                <Link to="/convertir" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800">Convertir un fichier</Link>
              </div>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map(entry => (
                <article key={entry.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <FileClock size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{entry.name}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {entry.operation} · {new Date(entry.createdAt).toLocaleString('fr-FR')} · {formatSize(entry.size)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => download(entry)}
                      className="rounded-lg bg-[#2457E6] p-2 text-white hover:bg-[#1e49c4]"
                      aria-label={`Télécharger ${entry.name}`}
                    >
                      <Download size={16} />
                    </button>
                    {'share' in navigator && (
                      <button
                        type="button"
                        onClick={() => void share(entry)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                        aria-label={`Partager ${entry.name}`}
                      >
                        <Share2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(entry.id)}
                      className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                      aria-label={`Supprimer ${entry.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
