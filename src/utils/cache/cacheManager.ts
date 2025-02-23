import { Logger } from '../monitoring';

const logger = Logger.getInstance();

interface CacheConfig {
  maxSize: number;
  ttl: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 3600000 // 1 hour default TTL
    };
    this.cache = new Map();
  }

  public set(key: string, value: T): void {
    try {
      if (this.cache.size >= this.config.maxSize) {
        this.evictOldest();
      }

      this.cache.set(key, {
        value,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Cache set failed:', error as Error);
    }
  }

  public get(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return null;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      logger.error('Cache get failed:', error as Error);
      return null;
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private evictOldest(): void {
    const oldestKey = Array.from(this.cache.entries())
      .reduce((oldest, current) => {
        return oldest[1].timestamp < current[1].timestamp ? oldest : current;
      })[0];

    this.cache.delete(oldestKey);
  }

  public getAll(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  public getAllEntries(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }
}
