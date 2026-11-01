// In-memory & sessionStorage client-side cache for instantaneous 0ms page navigation
const memoryCache = new Map<string, any>();

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  // 1. Check hot memory cache (fastest, 0ms)
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  // 2. Check browser sessionStorage (persists across reloads & navigations)
  try {
    const stored = window.sessionStorage.getItem(`algo_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryCache.set(key, parsed);
      return parsed as T;
    }
  } catch {
    // Ignore storage errors
  }

  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  memoryCache.set(key, data);
  try {
    window.sessionStorage.setItem(`algo_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateCache(key?: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    memoryCache.delete(key);
    try {
      window.sessionStorage.removeItem(`algo_${key}`);
    } catch {}
  } else {
    memoryCache.clear();
    try {
      window.sessionStorage.clear();
    } catch {}
  }
}
