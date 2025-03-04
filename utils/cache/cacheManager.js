import { Logger } from '../monitoring';
const logger = Logger.getInstance();
export class CacheManager {
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
            maxSize: config.maxSize || 1000,
            ttl: config.ttl || 3600000 // 1 hour default TTL
        };
        this.cache = new Map();
    }
    set(key, value) {
        try {
            if (this.cache.size >= this.config.maxSize) {
                this.evictOldest();
            }
            this.cache.set(key, {
                value,
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger.error('Cache set failed:', error);
        }
    }
    get(key) {
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
        }
        catch (error) {
            logger.error('Cache get failed:', error);
            return null;
        }
    }
    clear() {
        this.cache.clear();
    }
    isExpired(entry) {
        return Date.now() - entry.timestamp > this.config.ttl;
    }
    evictOldest() {
        const oldestKey = Array.from(this.cache.entries())
            .reduce((oldest, current) => {
            return oldest[1].timestamp < current[1].timestamp ? oldest : current;
        })[0];
        this.cache.delete(oldestKey);
    }
    getAll() {
        return Array.from(this.cache.values()).map(entry => entry.value);
    }
    getAllEntries() {
        return Array.from(this.cache.values());
    }
}
