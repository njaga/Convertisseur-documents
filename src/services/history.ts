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

const DB_NAME = 'fileconvert-history';
const STORE = 'operations';
const VERSION = 1;
const RETENTION = 7 * 24 * 60 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistory(name: string, operation: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const now = Date.now();
  const entry: HistoryEntry = { id: crypto.randomUUID(), name, operation, createdAt: now, expiresAt: now + RETENTION, size: blob.size, type: blob.type, blob };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const db = await openDb();
  const entries = await new Promise<HistoryEntry[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as HistoryEntry[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  const expired = entries.filter(entry => entry.expiresAt < Date.now());
  await Promise.all(expired.map(entry => deleteHistory(entry.id)));
  return entries.filter(entry => entry.expiresAt >= Date.now()).sort((a,b)=>b.createdAt-a.createdAt);
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  db.close();
}

export async function clearHistory(): Promise<void> {
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  db.close();
}

export function estimateWork(files: File[]): { seconds: number; memoryMb: number; warning?: string } {
  const total=files.reduce((sum,file)=>sum+file.size,0);
  const memoryMb=Math.ceil(total/1024/1024*2.5);
  const seconds=Math.max(1,Math.ceil(total/1024/1024*0.8));
  const deviceMemory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory;
  const warning=total>300*1024*1024?'Lot très lourd : traitez moins de fichiers à la fois.':deviceMemory&&deviceMemory<=4&&memoryMb>256?'Appareil à mémoire limitée : le traitement peut être interrompu.':undefined;
  return {seconds,memoryMb,warning};
}

export function explainError(error: unknown): string {
  const message=error instanceof Error?error.message:String(error);
  if(/password|encrypted/i.test(message)) return 'PDF protégé par mot de passe. Retirez la protection puis réessayez.';
  if(/memory|allocation|out of bounds/i.test(message)) return 'Mémoire insuffisante. Réduisez la taille du fichier ou choisissez un profil plus léger.';
  if(/codec|decoder|encoder/i.test(message)) return 'Codec non pris en charge par ce navigateur. Essayez MP4/WebM ou un autre appareil.';
  if(/network|fetch/i.test(message)) return 'Connexion requise pour ce moteur. Vérifiez le réseau puis relancez.';
  if(/corrupt|invalid|parse|illisible/i.test(message)) return 'Fichier corrompu ou illisible. Vérifiez le fichier source.';
  return message||'Opération impossible sur cet appareil.';
}
