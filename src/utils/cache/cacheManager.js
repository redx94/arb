"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
var monitoring_1 = require("../monitoring.cjs");
var logger = monitoring_1.Logger.getInstance();
var CacheManager = /** @class */ (function () {
    function CacheManager(config) {
        if (config === void 0) { config = {}; }
        this.config = {
            maxSize: config.maxSize || 1000,
            ttl: config.ttl || 3600000 // 1 hour default TTL
        };
        this.cache = new Map();
    }
    CacheManager.prototype.set = function (key, value) {
        try {
            if (this.cache.size >= this.config.maxSize) {
                this.evictOldest();
            }
            this.cache.set(key, {
                value: value,
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger.error('Cache set failed:', error);
        }
    };
    CacheManager.prototype.get = function (key) {
        try {
            var entry = this.cache.get(key);
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
    };
    CacheManager.prototype.clear = function () {
        this.cache.clear();
    };
    CacheManager.prototype.isExpired = function (entry) {
        return Date.now() - entry.timestamp > this.config.ttl;
    };
    CacheManager.prototype.evictOldest = function () {
        var oldestKey = Array.from(this.cache.entries())
            .reduce(function (oldest, current) {
            return oldest[1].timestamp < current[1].timestamp ? oldest : current;
        })[0];
        this.cache.delete(oldestKey);
    };
    CacheManager.prototype.getAll = function () {
        return Array.from(this.cache.values()).map(function (entry) { return entry.value; });
    };
    CacheManager.prototype.getAllEntries = function () {
        return Array.from(this.cache.values());
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
