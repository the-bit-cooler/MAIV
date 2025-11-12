import AsyncStorage from '@react-native-async-storage/async-storage';

import Storage from 'expo-sqlite/kv-store';

export const CACHE_VERSION = 'v1'; // Increment this whenever you change cache structure

interface CacheItem<T> {
  value: T;
  expiresAt: number; // timestamp in ms
  version: string; // current cache version
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
  try {
    const item: CacheItem<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : -1,
      version: CACHE_VERSION,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache.setCache()', error);
  }
}

/** Get a value if not expired, otherwise remove it and return null */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    try {
      const item: CacheItem<T> = JSON.parse(raw);
      if (
        (item.expiresAt !== -1 && Date.now() > item.expiresAt) ||
        item.version !== CACHE_VERSION
      ) {
        await removeCache(key);
        return null;
      }
      return item.value;
    } catch {
      await removeCache(key);
    }
  } catch (error) {
    console.error('Cache.getCache()', error);
  }

  return null;
}

/** Remove a cached value */
export async function removeCache(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Cache.removeCache()', error);
  }
}

/** Clear all cache */
export async function clearCache() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Cache.clearCache()', error);
  }
}

/** Check if a key is still valid (exists + not expired) */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    console.error('Cache.isCacheValid()', error);
  }

  return false;
}

/** Purge expired items */
export async function purgeExpiredCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const now = Date.now();
    let removed = 0;
    let kept = 0;

    for (const key of keys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;

      try {
        const item = JSON.parse(raw);
        if (
          !('expiresAt' in item) ||
          (item.expiresAt !== -1 && item.expiresAt < now) ||
          item.version !== CACHE_VERSION
        ) {
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
  } catch (error) {
    console.error('Cache.purgeExpiredCache()', error);
  }
}

// ==================================================
//  SQLITE/kv-store VERSION (for larger structured data)
// ==================================================

/** Save a value with an optional expiration time (in seconds) */
export async function setLargeCache<T>(key: string, value: T, ttlSeconds?: number) {
  try {
    const item: CacheItem<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : -1,
      version: CACHE_VERSION,
    };
    await Storage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache.setLargeCache()', error);
  }
}

/** Get a value if not expired, otherwise remove it and return null */
export async function getLargeCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await Storage.getItem(key);
    if (!raw) return null;

    try {
      const item: CacheItem<T> = JSON.parse(raw);
      if (
        (item.expiresAt !== -1 && Date.now() > item.expiresAt) ||
        item.version !== CACHE_VERSION
      ) {
        await removeLargeCache(key);
        return null;
      }
      return item.value;
    } catch {
      await removeLargeCache(key);
    }
  } catch (error) {
    console.error('Cache.getLargeCache()', error);
  }

  return null;
}

/** Get a value synchronously (kv-store only) */
export function getLargeCacheSync<T>(key: string): T | null {
  try {
    const raw = Storage.getItemSync(key);
    if (!raw) return null;

    try {
      const item: CacheItem<T> = JSON.parse(raw);
      if (
        (item.expiresAt !== -1 && Date.now() > item.expiresAt) ||
        item.version !== CACHE_VERSION
      ) {
        Storage.removeItemSync(key);
        return null;
      }
      return item.value;
    } catch {
      Storage.removeItemSync(key);
    }
  } catch (error) {
    console.error('Cache.getLargeCacheSync()', error);
  }

  return null;
}

/** Remove a cached value */
export async function removeLargeCache(key: string) {
  try {
    await Storage.removeItem(key);
  } catch (error) {
    console.error('Cache.removeLargeCache()', error);
  }
}

/** Clear the entire SQLite kv-store cache */
export async function clearLargeCache() {
  try {
    await Storage.clear();
  } catch (error) {
    console.error('Cache.clearLargeCache()', error);
  }
}

/** Check if a key is valid */
export async function isLargeCacheValid(key: string): Promise<boolean> {
  try {
    const value = await getLargeCache(key);
    return value !== null;
  } catch (error) {
    console.error('Cache.isLargeCacheValid()', error);
  }

  return false;
}

/** Purge expired kv-store items */
export async function purgeExpiredLargeCache() {
  try {
    const keys = await Storage.getAllKeys();
    const now = Date.now();
    let removed = 0;
    let kept = 0;

    for (const key of keys) {
      const raw = await Storage.getItem(key);
      if (!raw) continue;

      try {
        const item = JSON.parse(raw);
        if (
          !('expiresAt' in item) ||
          (item.expiresAt !== -1 && item.expiresAt < now) ||
          item.version !== CACHE_VERSION
        ) {
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
  } catch (error) {
    console.error('Cache.purgeExpiredLargeCache()', error);
  }
}
