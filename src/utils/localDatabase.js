/**
 * Local Database Engine for CapScribe Studio
 * Dual persistence: Electron File Database (UserData) + IndexedDB Fallback
 */

const DB_NAME = 'CapScribeLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveProjectToDb(project) {
  const record = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  // 1. If in Electron, save via IPC to UserData persistent JSON database
  if (window.electronAPI?.dbSaveProject) {
    try {
      const res = await window.electronAPI.dbSaveProject(record);
      if (res.success) return res.project;
    } catch (e) {
      console.warn('Electron DB save error, falling back to IndexedDB:', e);
    }
  }

  // 2. Browser / IndexedDB storage
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('IndexedDB save failed:', err);
    // LocalStorage fallback for lightweight records
    try {
      const existing = JSON.parse(localStorage.getItem('capscribe_projects_fallback') || '[]');
      const idx = existing.findIndex(p => p.id === record.id);
      if (idx >= 0) existing[idx] = record;
      else existing.unshift(record);
      localStorage.setItem('capscribe_projects_fallback', JSON.stringify(existing));
      return record;
    } catch {
      return record;
    }
  }
}

export async function getProjectsFromDb() {
  if (window.electronAPI?.dbGetProjects) {
    try {
      const res = await window.electronAPI.dbGetProjects();
      if (res.success && Array.isArray(res.projects)) {
        return res.projects;
      }
    } catch (e) {
      console.warn('Electron DB fetch error, falling back to IndexedDB:', e);
    }
  }

  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    const fallback = JSON.parse(localStorage.getItem('capscribe_projects_fallback') || '[]');
    return fallback;
  }
}

export async function deleteProjectFromDb(id) {
  if (window.electronAPI?.dbDeleteProject) {
    try {
      await window.electronAPI.dbDeleteProject(id);
    } catch (e) {
      console.warn('Electron DB delete error:', e);
    }
  }

  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    const existing = JSON.parse(localStorage.getItem('capscribe_projects_fallback') || '[]');
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem('capscribe_projects_fallback', JSON.stringify(filtered));
    return true;
  }
}

/**
 * Captures a compact 320x180 JPEG thumbnail data URL from a video element
 */
export function captureVideoThumbnail(videoElement) {
  try {
    if (!videoElement || videoElement.videoWidth === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = Math.round((320 / videoElement.videoWidth) * videoElement.videoHeight) || 180;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.65);
  } catch (err) {
    console.warn('Could not generate thumbnail:', err);
    return null;
  }
}
