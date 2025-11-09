import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ==================================================
//  ASYNCSTORAGE VERSION (lightweight user prefs, etc.)
// ==================================================

/** Save a value with an optional expiration time (in seconds) */
export async function setCache<T>(key: string, value: T, ttlSeconds?: number) {
  const item: CacheItem<T> = {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : -1,
  };
  await AsyncStorage.setItem(key, JSON.stringify(item));
}

/** Get a value if not expired, otherwise remove it and return null */
export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const item: CacheItem<T> = JSON.parse(raw);
    if (item.expiresAt !== -1 && Date.now() > item.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

/** Remove a cached value */
export async function removeCache(key: string) {
  await AsyncStorage.removeItem(key);
}

/** Clear all cache */
export async function clearCache() {
  await AsyncStorage.clear();
}

/** Check if a key is still valid (exists + not expired) */
export async function isCacheValid(key: string): Promise<boolean> {
  const value = await getCache(key);
  return value !== null;
}

/** Purge expired items */
export async function purgeExpiredCache() {
  const keys = await AsyncStorage.getAllKeys();
  const now = Date.now();
  let removed = 0;
  let kept = 0;

  for (const key of keys) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;

    try {
      const item = JSON.parse(raw);
      if (!('expiresAt' in item) || (item.expiresAt !== -1 && item.expiresAt < now)) {
        await AsyncStorage.removeItem(key);
        removed++;
      } else {
        kept++;
      }
    } catch {
      await AsyncStorage.removeItem(key);
      removed++;
    }
  }

  console.log(`🧹 Small cache cleanup → removed ${removed}, kept ${kept}`);
}

// ==================================================
//  SQLITE/kv-store VERSION (for larger structured data)
// ==================================================

/** Save a value with an optional expiration time (in seconds) */
export async function setLargeCache<T>(key: string, value: T, ttlSeconds?: number) {
  const item: CacheItem<T> = {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : -1,
  };
  await Storage.setItem(key, JSON.stringify(item));
}

/** Get a value if not expired, otherwise remove it and return null */
export async function getLargeCache<T>(key: string): Promise<T | null> {
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

/** Get a value synchronously (kv-store only) */
export function getLargeCacheSync<T>(key: string): T | null {
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

/** Remove a cached value */
export async function removeLargeCache(key: string) {
  await Storage.removeItem(key);
}

/** Clear the entire SQLite kv-store cache */
export async function clearLargeCache() {
  await Storage.clear();
}

/** Check if a key is valid */
export async function isLargeCacheValid(key: string): Promise<boolean> {
  const value = await getLargeCache(key);
  return value !== null;
}

/** Purge expired kv-store items */
export async function purgeExpiredLargeCache() {
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

  console.log(`🧹 Large cache cleanup → removed ${removed}, kept ${kept}`);
}
