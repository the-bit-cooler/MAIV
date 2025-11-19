export interface CacheItem<T> {
  value: T;
  expiresAt: number; // timestamp in ms
  version: string; // current cache version
}
