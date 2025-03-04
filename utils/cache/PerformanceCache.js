import { Logger } from '../monitoring';
const logger = Logger.getInstance();
export class PerformanceCache {
    constructor(config = {}) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.config = {
            ttl: config.ttl || 60000, // 1 minute default
            maxSize: config.maxSize || 1000
        };
        this.cache = new Map();
    }
    async getOrSet(key, operation) {
        try {
            const cached = this.get(key);
            if (cached !== undefined) {
                return cached;
            }
            const value = await operation();
            this.set(key, value);
            return value;
        }
        catch (error) {
            logger.error('Cache operation failed:', error);
            throw error;
        }
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (Date.now() - entry.timestamp > this.config.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        entry.hits++;
        return entry.value;
    }
    set(key, value) {
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
    evictStaleEntries() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.ttl) {
                this.cache.delete(key);
            }
        }
    }
    evictLeastUsed() {
        let leastUsedKey = null;
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
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
