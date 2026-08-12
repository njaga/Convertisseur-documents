import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, FilePenLine, FormInput, HardDrive, Loader2, Play, ShieldCheck, Trash2 } from 'lucide-react';
import {
  clearWorkspaceDrafts,
  deleteWorkspaceDraft,
  getWorkspaceStorageEstimate,
  listWorkspaceDrafts,
  type WorkspaceDraft,
  type WorkspaceStorageEstimate,
  workspaceDraftToFile,
} from '../services/workspace';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const formatDate = (value: number) => new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(value);

export default function WorkspaceDraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<WorkspaceDraft[]>([]);
  const [estimate, setEstimate] = useState<WorkspaceStorageEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      const [nextDrafts, nextEstimate] = await Promise.all([
        listWorkspaceDrafts(),
        getWorkspaceStorageEstimate().catch(() => null),
      ]);
      setDrafts(nextDrafts);
      setEstimate(nextEstimate);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de charger les brouillons locaux.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Brouillons locaux | Doxali';
    void reload();
  }, []);

  const resume = (draft: WorkspaceDraft) => {
    const initialFile = workspaceDraftToFile(draft);
    navigate(draft.kind === 'pdf-form' ? '/formulaires-pdf' : '/modifier-pdf', {
      state: { initialFile },
    });
  };

  const remove = async (id: string) => {
    await deleteWorkspaceDraft(id);
    await reload();
  };

  const clearAll = async () => {
    await clearWorkspaceDrafts();
    await reload();
  };

  return (
    <main className="flex-grow bg-[#f7f8fb] px-5 pb-20 pt-28 text-gray-950 md:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={14} /> Stockés uniquement sur cet appareil
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Brouillons locaux</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">Doxali sauvegarde automatiquement vos travaux PDF en cours pour vous permettre de reprendre après avoir fermé l’onglet ou le navigateur.</p>
            </div>
            {drafts.length > 0 && <button type="button" onClick={() => void clearAll()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={15} /> Tout supprimer</button>}
          </div>
        </header>

        {estimate && (
          <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
            <HardDrive size={18} className="text-gray-500" />
            <span><strong className="text-gray-900">Stockage navigateur :</strong> {formatBytes(estimate.usage)} utilisés sur environ {formatBytes(estimate.quota)} disponibles.</span>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-12 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Chargement des brouillons…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
        ) : drafts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <FilePenLine size={34} className="mx-auto text-gray-300" />
            <h2 className="mt-4 font-semibold text-gray-900">Aucun travail à reprendre</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Commencez à modifier un PDF ou à préparer un formulaire : le brouillon apparaîtra ici automatiquement.</p>
            <button type="button" onClick={() => navigate('/modifier-pdf')} className="mt-5 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">Modifier un PDF</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {drafts.map(draft => {
              const Icon = draft.kind === 'pdf-form' ? FormInput : FilePenLine;
              return (
                <article key={draft.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-950" title={draft.fileName}>{draft.fileName}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">{draft.kind === 'pdf-form' ? 'Formulaire PDF' : 'Modification PDF'} · {formatBytes(draft.file.size)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500"><Clock3 size={13} /> Sauvegardé le {formatDate(draft.updatedAt)}</div>
                  <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => resume(draft)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"><Play size={15} /> Reprendre</button>
                    <button type="button" onClick={() => void remove(draft.id)} aria-label={`Supprimer le brouillon ${draft.fileName}`} className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:border-red-100 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-gray-400">Les brouillons expirent après 30 jours sans modification. Les plus anciens sont automatiquement supprimés lorsque la limite locale est atteinte.</p>
      </div>
    </main>
  );
}
