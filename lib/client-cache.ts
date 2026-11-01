// In-memory client-side cache for instantaneous page navigation (SWR style)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh TTL

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const entry = cache.get(key);
  if (!entry) return null;
  // Stale-while-revalidate: return data even if stale, caller can revalidate
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

