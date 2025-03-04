export class RateLimiter {
    constructor(maxRequests, intervalMs = 60000) {
        Object.defineProperty(this, "requests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxRequests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "interval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.maxRequests = maxRequests;
        this.interval = intervalMs;
        this.requests = [];
    }
    checkLimit() {
        const now = Date.now();
        this.requests = this.requests.filter(timestamp => now - timestamp < this.interval);
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        this.requests.push(now);
        return true;
    }
}
