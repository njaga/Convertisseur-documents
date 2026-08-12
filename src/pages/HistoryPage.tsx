import { useEffect, useState } from 'react';
import { Download, History, Share2, Trash2 } from 'lucide-react';
import {
  clearHistory,
  deleteHistory,
  type HistoryEntry,
  listHistory,
} from '../services/history';

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    listHistory()
      .then(values => {
        if (active) setEntries(values);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
    await deleteHistory(id);
    setEntries(current => current.filter(entry => entry.id !== id));
  };

  const clear = async () => {
    await clearHistory();
    setEntries([]);
  };

  return (
    <main className="flex-grow bg-gray-50 px-6 pb-20 pt-28">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2457E6]">
            <History size={20} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">Historique local</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Les résultats conservés ici restent sur cet appareil et sont automatiquement supprimés après 7 jours.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-gray-900">
              {entries.length} fichier{entries.length > 1 ? 's' : ''}
            </h2>
            {entries.length > 0 && (
              <button type="button" onClick={() => void clear()} className="text-left text-sm font-medium text-red-600 hover:text-red-700">
                Supprimer tout l’historique
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Chargement…</p>}

          {!loading && entries.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Aucun fichier dans l’historique.</p>
          )}

          {!loading && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map(entry => (
                <article key={entry.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
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
