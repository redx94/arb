export class RiskManager {
  private static instance: RiskManager;

  private constructor() {}

  public static getInstance(): RiskManager {
    if (!RiskManager.instance) {
      RiskManager.instance = new RiskManager();
    }
    return RiskManager.instance;
  }

  // Updated validation: if price difference exceeds 5%, throw an error.
  public validateTrade(data: { dex: number; cex: number }): void {
    const diffPercentage = (Math.abs(data.cex - data.dex) / Math.min(data.cex, data.dex)) * 100;
    if (diffPercentage > 5) {
      throw new Error('Risk limit exceeded: Price difference exceeds 5% threshold.');
    }
  }
}