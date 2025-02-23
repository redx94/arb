
interface ProviderScore {
  successRate: number;
  avgLatency: number;
  lastFailure: number;
  score: number;
}

export class HighAvailability {
  // Add backup RPC endpoints
  private readonly BACKUP_PROVIDERS = [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com'
  ];

  // Provider tracking
  private providerStatus: Map<string, object> = new Map();
  private providers: Map<string, { pollingInterval: number }> = new Map();
  private providerScores: Map<string, ProviderScore> = new Map();

  private calculateProviderScore(providerId: string): number {
    const status = this.providerStatus.get(providerId);
    const score = this.providerScores.get(providerId);
    
    if (!status || !score) return 0;
    
    return (
      (1 / (score.avgLatency + 1)) * 0.4 +    // Latency score (40%)
      score.successRate * 0.4 +                // Success rate (40%)
      (1 / (Date.now() - score.lastFailure + 1)) * 0.2  // Time since last failure (20%)
    );
  }

  private async rotateProviders(): Promise<void> {
    const scores = Array.from(this.providers.keys())
      .map(id => ({
        id,
        score: this.calculateProviderScore(id)
      }))
      .sort((a, b) => b.score - a.score);

    const activeProviders = scores.slice(0, 2).map(s => s.id);
    
    for (const [id, provider] of this.providers) {
      provider.pollingInterval = activeProviders.includes(id) ? 1000 : 5000;
    }
  }
}
