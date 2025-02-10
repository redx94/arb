export class PriceFeed {
  private static instance: PriceFeed;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): PriceFeed {
    if (!PriceFeed.instance) {
      PriceFeed.instance = new PriceFeed();
    }
    return PriceFeed.instance;
  }

  public subscribe(callback: (data: any) => void): () => void {
    // Dummy implementation for subscription
    const intervalId = setInterval(() => {
      const data = {
        dex: Math.random() * 1000,
        cex: Math.random() * 1000,
        timestamp: Date.now(),
      };
      callback(data);
    }, 1000);

    return () => clearInterval(intervalId);
  }
}
