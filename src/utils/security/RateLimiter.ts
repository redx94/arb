export class RateLimiter {
  private requests: number[];
  private readonly maxRequests: number;
  private readonly interval: number;

  constructor(maxRequests: number, intervalMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.interval = intervalMs;
    this.requests = [];
  }

  checkLimit(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.interval);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}
