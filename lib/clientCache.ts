"use client";

/**
 * High-performance client-side SWR (Stale-While-Revalidate) cache.
 * Provides instant 0ms page loads from memory and session storage
 * while background-syncing with the MongoDB API.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryStore: Record<string, CacheEntry<any>> = {};

export function getCached<T>(key: string, maxAgeMs = 180000): T | null {
  if (typeof window === "undefined") return null;

  // 1. In-memory hot cache
  const inMemory = memoryStore[key];
  if (inMemory && Date.now() - inMemory.timestamp < maxAgeMs) {
    return inMemory.data as T;
  }

  // 2. Session storage warm cache (persists tab navigation)
  try {
    const raw = sessionStorage.getItem(`rp_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < maxAgeMs) {
        memoryStore[key] = parsed;
        return parsed.data;
      }
    }
  } catch {
    // SessionStorage unavailable or restricted
  }

  return null;
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryStore[key] = entry;

  try {
    sessionStorage.setItem(`rp_${key}`, JSON.stringify(entry));
  } catch {
    // Storage quota or privacy mode
  }
}

export function clearCache(prefix?: string): void {
  if (typeof window === "undefined") return;

  if (prefix) {
    Object.keys(memoryStore).forEach((k) => {
      if (k.startsWith(prefix)) delete memoryStore[k];
    });
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(`rp_${prefix}`)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  } else {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("rp_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}
