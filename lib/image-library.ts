// Tiny IndexedDB-backed image library so the user can save reference photos
// once and reuse them across carousel projects without re-uploading.

export interface LibraryImage {
  id: string;
  base64: string;
  name: string;
  savedAt: number;
}

const DB_NAME = 'clubsheis-carousel-library';
const STORE = 'images';
const VERSION = 1;

function isClient(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isClient()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listLibraryImages(): Promise<LibraryImage[]> {
  if (!isClient()) return [];
  try {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const items = (req.result as LibraryImage[]) || [];
        items.sort((a, b) => b.savedAt - a.savedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveLibraryImage(img: { base64: string; name: string }): Promise<LibraryImage | null> {
  if (!isClient()) return null;
  try {
    const db = await open();
    const entry: LibraryImage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      base64: img.base64,
      name: img.name,
      savedAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return null;
  }
}

export async function removeLibraryImage(id: string): Promise<void> {
  if (!isClient()) return;
  try {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return;
  }
}
