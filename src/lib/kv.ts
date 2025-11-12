/**
 * Cloudflare KV Storage Utilities
 * Handles all KV operations for persistent data storage
 */

// KV namespace type definition
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

// KV namespace binding (will be available in Cloudflare Workers environment)
declare global {
  interface Global {
    KV?: KVNamespace;
  }
}

/**
 * Get data from KV
 * @param key - The key to retrieve
 * @returns The stored value or null
 */
export async function getFromKV<T>(key: string): Promise<T | null> {
  try {
    const kv = (globalThis as any).KV;
    if (kv) {
      const data = await kv.get(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    console.error(`Error getting ${key} from KV:`, error);
    return null;
  }
}

/**
 * Store data in KV
 * @param key - The key to store
 * @param value - The value to store
 * @param expirationTtl - Optional TTL in seconds
 */
export async function setInKV<T>(
  key: string,
  value: T,
  expirationTtl?: number
): Promise<void> {
  try {
    const kv = (globalThis as any).KV;
    if (kv) {
      await kv.put(key, JSON.stringify(value), {
        expirationTtl
      });
    }
  } catch (error) {
    console.error(`Error setting ${key} in KV:`, error);
  }
}

/**
 * Delete data from KV
 * @param key - The key to delete
 */
export async function deleteFromKV(key: string): Promise<void> {
  try {
    const kv = (globalThis as any).KV;
    if (kv) {
      await kv.delete(key);
    }
  } catch (error) {
    console.error(`Error deleting ${key} from KV:`, error);
  }
}

/**
 * List all keys in KV
 * @param prefix - Optional prefix to filter keys
 */
export async function listKVKeys(prefix?: string): Promise<string[]> {
  try {
    const kv = (globalThis as any).KV;
    if (kv) {
      const list = await kv.list({ prefix });
      return list.keys.map((k: any) => k.name);
    }
    return [];
  } catch (error) {
    console.error('Error listing KV keys:', error);
    return [];
  }
}

/**
 * Clear all data from KV (use with caution)
 */
export async function clearKV(): Promise<void> {
  try {
    const kv = (globalThis as any).KV;
    if (kv) {
      const keys = await listKVKeys();
      for (const key of keys) {
        await deleteFromKV(key);
      }
    }
  } catch (error) {
    console.error('Error clearing KV:', error);
  }
}

// KV Key constants
export const KV_KEYS = {
  TEAMS: 'ipl:teams',
  PLAYERS: 'ipl:players',
  MATCHES: 'ipl:matches',
  NEWS: 'ipl:news',
  CONTENT: 'ipl:content',
  PREDICTIONS: 'ipl:predictions',
  SETTINGS: 'ipl:settings'
} as const;
