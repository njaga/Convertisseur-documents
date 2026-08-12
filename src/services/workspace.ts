export type WorkspaceDraftKind = 'pdf-editor' | 'pdf-form';

export interface WorkspaceDraft<State = unknown> {
  id: string;
  kind: WorkspaceDraftKind;
  name: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  fileName: string;
  fileType: string;
  fileLastModified: number;
  file: Blob;
  state: State;
}

export interface WorkspaceStorageEstimate {
  usage: number;
  quota: number;
}

const DB_NAME = 'doxali-workspaces';
const STORE = 'drafts';
const VERSION = 1;
const RETENTION = 30 * 24 * 60 * 60 * 1000;
const MAX_DRAFTS = 12;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Le stockage local des brouillons n’est pas disponible sur cet appareil.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('kind', 'kind');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir le stockage local.'));
  });
}

function fingerprint(kind: WorkspaceDraftKind, file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${kind}:${file.name}:${file.size}:${file.lastModified}`;
}

export function workspaceFileFingerprint(kind: WorkspaceDraftKind, file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return fingerprint(kind, file);
}

async function readAll(): Promise<WorkspaceDraft[]> {
  const db = await openDb();
  try {
    return await new Promise<WorkspaceDraft[]>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as WorkspaceDraft[]);
      request.onerror = () => reject(request.error ?? new Error('Impossible de lire les brouillons.'));
    });
  } finally {
    db.close();
  }
}

async function putDraft(draft: WorkspaceDraft): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(draft);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible d’enregistrer le brouillon.'));
    });
  } finally {
    db.close();
  }
}

export async function deleteWorkspaceDraft(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de supprimer le brouillon.'));
    });
  } finally {
    db.close();
  }
}

export async function clearWorkspaceDrafts(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de vider les brouillons.'));
    });
  } finally {
    db.close();
  }
}

export async function listWorkspaceDrafts(): Promise<WorkspaceDraft[]> {
  const drafts = await readAll();
  const now = Date.now();
  const expired = drafts.filter(draft => draft.expiresAt <= now);
  await Promise.all(expired.map(draft => deleteWorkspaceDraft(draft.id).catch(() => undefined)));
  return drafts
    .filter(draft => draft.expiresAt > now)
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getWorkspaceDraft<State = unknown>(id: string): Promise<WorkspaceDraft<State> | null> {
  const db = await openDb();
  try {
    const draft = await new Promise<WorkspaceDraft<State> | null>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as WorkspaceDraft<State> | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Impossible de lire le brouillon.'));
    });
    if (draft && draft.expiresAt <= Date.now()) {
      await deleteWorkspaceDraft(draft.id).catch(() => undefined);
      return null;
    }
    return draft;
  } finally {
    db.close();
  }
}

export async function findWorkspaceDraft<State = unknown>(kind: WorkspaceDraftKind, file: File): Promise<WorkspaceDraft<State> | null> {
  const expected = fingerprint(kind, file);
  const drafts = await listWorkspaceDrafts();
  const match = drafts.find(draft => fingerprint(draft.kind, {
    name: draft.fileName,
    size: draft.file.size,
    lastModified: draft.fileLastModified,
  } as File) === expected);
  return (match as WorkspaceDraft<State> | undefined) ?? null;
}

export async function saveWorkspaceDraft<State>(
  kind: WorkspaceDraftKind,
  file: File,
  state: State,
  existingId?: string,
): Promise<WorkspaceDraft<State>> {
  const now = Date.now();
  let id = existingId;
  let createdAt = now;

  if (!id) {
    const existing = await findWorkspaceDraft<State>(kind, file).catch(() => null);
    id = existing?.id;
    createdAt = existing?.createdAt ?? now;
  }

  const draft: WorkspaceDraft<State> = {
    id: id ?? crypto.randomUUID(),
    kind,
    name: kind === 'pdf-editor' ? `Modification · ${file.name}` : `Formulaire · ${file.name}`,
    createdAt,
    updatedAt: now,
    expiresAt: now + RETENTION,
    fileName: file.name,
    fileType: file.type || 'application/pdf',
    fileLastModified: file.lastModified,
    file,
    state,
  };

  await putDraft(draft as WorkspaceDraft);
  await trimWorkspaceDrafts();
  return draft;
}

async function trimWorkspaceDrafts(): Promise<void> {
  const drafts = await readAll();
  const sorted = [...drafts].sort((left, right) => right.updatedAt - left.updatedAt);
  const obsolete = sorted.slice(MAX_DRAFTS);
  await Promise.all(obsolete.map(draft => deleteWorkspaceDraft(draft.id).catch(() => undefined)));
}

export function workspaceDraftToFile(draft: WorkspaceDraft): File {
  return new File([draft.file], draft.fileName, {
    type: draft.fileType || draft.file.type || 'application/pdf',
    lastModified: draft.fileLastModified,
  });
}

export async function getWorkspaceStorageEstimate(): Promise<WorkspaceStorageEstimate | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  if (typeof estimate.usage !== 'number' || typeof estimate.quota !== 'number') return null;
  return { usage: estimate.usage, quota: estimate.quota };
}
