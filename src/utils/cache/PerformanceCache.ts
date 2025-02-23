import { Logger } from '../monitoring';

const logger = Logger.getInstance();

interface CacheConfig {
  ttl: number;
  maxSize: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

export class PerformanceCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: config.ttl || 60000, // 1 minute default
      maxSize: config.maxSize || 1000
    };
    this.cache = new Map();
  }

  public async getOrSet(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      const cached = this.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const value = await operation();
      this.set(key, value);
      return value;
    } catch (error) {
      logger.error('Cache operation failed:', error as Error);
      throw error;
    }
  }

  private get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry.value;
  }

  private set(key: string, value: T): void {
    this.evictStaleEntries();

    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 1
    });
  }

  private evictStaleEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
