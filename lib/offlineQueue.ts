"use client";

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  createdAt: number;
  retryCount: number;
}

const DB_NAME = "rupeepulse_offline_db";
const STORE_NAME = "offline_requests";
const DB_VERSION = 1;

/**
 * Opens or initializes the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("endpoint", "endpoint", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueues a write request into IndexedDB when offline.
 */
export async function enqueueOfflineRequest(
  endpoint: string,
  method: string = "POST",
  payload: any
): Promise<QueuedRequest> {
  const db = await openDB();
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const item: QueuedRequest = {
    id,
    endpoint,
    method,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);

    req.onsuccess = () => {
      notifyQueueChanged();
      resolve(item);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Gets all pending requests from the queue in chronological order (FIFO).
 */
export async function getOfflineQueue(): Promise<QueuedRequest[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("createdAt");
      const req = index.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Gets the total count of pending offline requests.
 */
export async function getOfflineQueueCount(): Promise<number> {
  try {
    const queue = await getOfflineQueue();
    return queue.length;
  } catch {
    return 0;
  }
}

/**
 * Removes a successfully synced request from IndexedDB.
 */
async function removeQueuedRequest(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to delete queued item", e);
  }
}

/**
 * Drains the queue by sending each request to the server in order.
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        await removeQueuedRequest(item.id);
        synced++;
      } else {
        // Server returned 4xx/5xx error (invalid payload or server issue)
        failed++;
      }
    } catch (e) {
      // Network failed mid-drain; stop draining to prevent hammering
      failed++;
      break;
    }
  }

  notifyQueueChanged();

  if (synced > 0) {
    window.dispatchEvent(new CustomEvent("finance_data_updated"));
    window.dispatchEvent(
      new CustomEvent("rupeepulse_toast", {
        detail: {
          type: "success",
          message: `Synced ${synced} offline transaction(s) to cloud! ☁️`,
        },
      })
    );
  }

  return { synced, failed };
}

/**
 * Emits an event whenever queue contents change so UI can update sync pills.
 */
function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    getOfflineQueueCount().then((count) => {
      window.dispatchEvent(
        new CustomEvent("rupeepulse_offline_queue_changed", { detail: { count } })
      );
    });
  }
}

/**
 * Initializes auto-sync event listeners when app starts.
 */
export function initOfflineSyncListeners() {
  if (typeof window === "undefined") return;

  const handleOnline = () => {
    syncOfflineQueue();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncOfflineQueue();
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Initial attempt if network is already up
  if (navigator.onLine) {
    setTimeout(() => syncOfflineQueue(), 2000);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
