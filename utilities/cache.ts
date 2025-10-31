import Storage from 'expo-sqlite/kv-store';

interface CacheItem<T> {
  value: T;
  expiresAt: number; // timestamp in ms
}

export const TTL = {
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
};

/**
 * Save a value with an optional expiration time (in seconds)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds?: number) {
  const item: CacheItem<T> = {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : -1, // -1 never expires
  };
  await Storage.setItem(key, JSON.stringify(item));
}

/**
 * Get a value if not expired, otherwise remove it and return null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await Storage.getItem(key);
  if (!raw) return null;

  try {
    const item: CacheItem<T> = JSON.parse(raw);
    if (item.expiresAt !== -1 && Date.now() > item.expiresAt) {
      await Storage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    await Storage.removeItem(key);
    return null;
  }
}

/**
 * Get a value synchronously if not expired, otherwise remove it synchronously and return null
 */
export function getCacheSync<T>(key: string): T | null {
  const raw = Storage.getItemSync(key);
  if (!raw) return null;

  try {
    const item: CacheItem<T> = JSON.parse(raw);
    if (item.expiresAt !== -1 && Date.now() > item.expiresAt) {
      Storage.removeItemSync(key);
      return null;
    }
    return item.value;
  } catch {
    Storage.removeItemSync(key);
    return null;
  }
}

/**
 * Remove a cached value
 */
export async function removeCache(key: string) {
  await Storage.removeItem(key);
}

/**
 * Remove a cached value
 */
export async function clearCache() {
  await Storage.clear();
}

/**
 * Helper: check if a key is still valid (exists + not expired)
 */
export async function isCacheValid(key: string): Promise<boolean> {
  const value = await getCache(key);
  return value !== null;
}

/**
 * Automatically purge all expired cache items
 * Call this once on app startup
 */
export async function purgeExpiredCache() {
  const keys = await Storage.getAllKeys();
  const now = Date.now();
  let removed = 0;
  let kept = 0;

  for (const key of keys) {
    const raw = await Storage.getItem(key);
    if (!raw) continue;

    try {
      const item = JSON.parse(raw);
      if (!('expiresAt' in item) || (item.expiresAt !== -1 && item.expiresAt < now)) {
        await Storage.removeItem(key);
        removed++;
      } else {
        kept++;
      }
    } catch {
      await Storage.removeItem(key);
      removed++;
    }
  }

  console.log(`🧹 Cache cleanup → removed ${removed}, kept ${kept}`);
}
