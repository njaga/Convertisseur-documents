export interface HistoryEntry {
  id: string;
  name: string;
  operation: string;
  createdAt: number;
  expiresAt: number;
  size: number;
  type: string;
  blob: Blob;
}

const DB_NAME = 'doxali-history';
const LEGACY_DB_NAME = 'fileconvert-history';
const STORE = 'operations';
const VERSION = 1;
const RETENTION = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 60;
const HISTORY_EVENT = 'doxali:history-changed';
const MIGRATION_KEY = 'doxali-history-migrated-v1';

function ensureIndexedDb() {
  if (!('indexedDB' in globalThis)) {
    throw new Error('Le stockage local IndexedDB n’est pas disponible dans ce navigateur.');
  }
}

function openNamedDb(name: string): Promise<IDBDatabase> {
  ensureIndexedDb();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir le stockage local.'));
    request.onblocked = () => reject(new Error('Le stockage local est momentanément bloqué par un autre onglet.'));
  });
}

const getAllEntries = (db: IDBDatabase) => new Promise<HistoryEntry[]>((resolve, reject) => {
  if (!db.objectStoreNames.contains(STORE)) {
    resolve([]);
    return;
  }
  const request = db.transaction(STORE).objectStore(STORE).getAll();
  request.onsuccess = () => resolve(request.result as HistoryEntry[]);
  request.onerror = () => reject(request.error ?? new Error('Impossible de lire l’historique local.'));
});

const writeEntries = (db: IDBDatabase, entries: HistoryEntry[]) => new Promise<void>((resolve, reject) => {
  if (!entries.length) {
    resolve();
    return;
  }
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  entries.forEach(entry => store.put(entry));
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error ?? new Error('Impossible d’enregistrer l’historique local.'));
});

let migrationPromise: Promise<void> | null = null;

async function migrateLegacyHistory(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      if (localStorage.getItem(MIGRATION_KEY) === '1') return;
    } catch {
      // Storage access can be restricted independently from IndexedDB.
    }

    try {
      const databaseList = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
      if (databaseList.length && !databaseList.some(database => database.name === LEGACY_DB_NAME)) {
        try { localStorage.setItem(MIGRATION_KEY, '1'); } catch { /* no-op */ }
        return;
      }

      if (!databaseList.length && typeof indexedDB.databases !== 'function') return;

      const legacy = await openNamedDb(LEGACY_DB_NAME);
      const entries = await getAllEntries(legacy);
      legacy.close();

      const now = Date.now();
      const valid = entries.filter(entry => entry.expiresAt >= now && entry.blob instanceof Blob);
      if (valid.length) {
        const target = await openNamedDb(DB_NAME);
        await writeEntries(target, valid);
        target.close();
      }

      try { localStorage.setItem(MIGRATION_KEY, '1'); } catch { /* no-op */ }
    } catch {
      // A failed migration must never prevent the new store from working.
    }
  })();

  return migrationPromise;
}

async function openDb(): Promise<IDBDatabase> {
  ensureIndexedDb();
  await migrateLegacyHistory();
  return openNamedDb(DB_NAME);
}

function announceHistoryChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(HISTORY_EVENT));
}

async function trimHistory(db: IDBDatabase): Promise<void> {
  const entries = await getAllEntries(db);
  const now = Date.now();
  const sorted = entries.sort((a, b) => b.createdAt - a.createdAt);
  const remove = sorted.filter((entry, index) => entry.expiresAt < now || index >= MAX_ENTRIES);
  if (!remove.length) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    remove.forEach(entry => store.delete(entry.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Impossible de nettoyer l’historique local.'));
  });
}

export async function saveHistory(name: string, operation: string, blob: Blob): Promise<void> {
  if (!blob.size) return;

  const db = await openDb();
  const now = Date.now();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    name,
    operation,
    createdAt: now,
    expiresAt: now + RETENTION,
    size: blob.size,
    type: blob.type || 'application/octet-stream',
    blob,
  };

  try {
    await writeEntries(db, [entry]);
    await trimHistory(db);
  } finally {
    db.close();
  }

  announceHistoryChange();
}

export async function saveHistoryFromUrl(name: string, operation: string, url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Impossible de préparer le résultat pour l’historique local.');
  await saveHistory(name, operation, await response.blob());
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const db = await openDb();
  try {
    await trimHistory(db);
    const entries = await getAllEntries(db);
    const now = Date.now();
    return entries
      .filter(entry => entry.expiresAt >= now && entry.blob instanceof Blob)
      .sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Impossible de supprimer ce fichier de l’historique.'));
    });
  } finally {
    db.close();
  }
  announceHistoryChange();
}

export async function clearHistory(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Impossible de vider l’historique local.'));
    });
  } finally {
    db.close();
  }
  announceHistoryChange();
}

export function subscribeHistory(listener: () => void): () => void {
  window.addEventListener(HISTORY_EVENT, listener);
  return () => window.removeEventListener(HISTORY_EVENT, listener);
}

export function estimateWork(files: File[]): { seconds: number; memoryMb: number; warning?: string } {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const memoryMb = Math.ceil(total / 1024 / 1024 * 2.5);
  const seconds = Math.max(1, Math.ceil(total / 1024 / 1024 * 0.8));
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const warning = total > 300 * 1024 * 1024
    ? 'Lot très lourd : traitez moins de fichiers à la fois.'
    : deviceMemory && deviceMemory <= 4 && memoryMb > 256
      ? 'Appareil à mémoire limitée : le traitement peut être interrompu.'
      : undefined;
  return { seconds, memoryMb, warning };
}

export function explainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted/i.test(message)) return 'PDF protégé par mot de passe. Retirez la protection puis réessayez.';
  if (/memory|allocation|out of bounds/i.test(message)) return 'Mémoire insuffisante. Réduisez la taille du fichier ou choisissez un profil plus léger.';
  if (/codec|decoder|encoder/i.test(message)) return 'Codec non pris en charge par ce navigateur. Essayez MP4/WebM ou un autre appareil.';
  if (/network|fetch/i.test(message)) return 'Connexion requise pour ce moteur. Vérifiez le réseau puis relancez.';
  if (/corrupt|invalid|parse|illisible/i.test(message)) return 'Fichier corrompu ou illisible. Vérifiez le fichier source.';
  return message || 'Opération impossible sur cet appareil.';
}
