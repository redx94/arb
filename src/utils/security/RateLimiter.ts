import { Logger } from '../monitoring';

const logger = Logger.getInstance();

export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();
  private readonly WINDOW_MS = 60000; // 1 minute
  private readonly MAX_REQUESTS = 100; // per window

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public async checkLimit(identifier: string): Promise<boolean> {
    try {
      const now = Date.now();
      const requests = this.requests.get(identifier) || [];

      // Remove expired timestamps
      const validRequests = requests.filter(timestamp =>
        now - timestamp < this.WINDOW_MS
      );

      if (validRequests.length >= this.MAX_REQUESTS) {
        logger.warn('Rate limit exceeded for:', identifier);
        return false;
      }

      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      return true;
    } catch (error) {
      logger.error('Rate limit check failed:', error as Error);
      return false;
    }
  }

  public getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(timestamp =>
      now - timestamp < this.WINDOW_MS
    );
    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }
}
