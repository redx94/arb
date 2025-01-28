import { ethers } from 'ethers';
import { PriceFeed } from '../priceFeeds';
import { PerformanceMonitor } from '../monitoring';
import type { PriceData } from '../../types';

interface PathNode {
  exchange: string;
  price: number;
  liquidity: number;
  fees: number;
}

interface ArbitragePath {
  nodes: PathNode[];
  expectedProfit: number;
  totalFees: number;
  executionTime: number;
}

export class PathFinder {
  private static instance: PathFinder;
  private readonly priceFeed = PriceFeed.getInstance();
  private readonly performanceMonitor = PerformanceMonitor.getInstance();
  private readonly MAX_PATH_LENGTH = 3;
  private readonly MIN_LIQUIDITY = ethers.parseEther('10'); // 10 ETH

  private constructor() {}

  public static getInstance(): PathFinder {
    if (!PathFinder.instance) {
      PathFinder.instance = new PathFinder();
    }
    return PathFinder.instance;
  }

  public async findOptimalPath(
    startExchange: string,
    amount: number,
    priceData: PriceData
  ): Promise<ArbitragePath | null> {
    this.performanceMonitor.startTimer('pathFinding');

    try {
      const exchanges = ['DEX_A', 'DEX_B', 'CEX_A', 'CEX_B'];
      const paths: ArbitragePath[] = [];

      // Generate all possible paths up to MAX_PATH_LENGTH
      for (let i = 2; i <= this.MAX_PATH_LENGTH; i++) {
        const currentPaths = this.generatePaths(exchanges, i, startExchange);
        for (const path of currentPaths) {
          const arbitragePath = await this.evaluatePath(path, amount, priceData);
          if (arbitragePath && arbitragePath.expectedProfit > 0) {
            paths.push(arbitragePath);
          }
        }
      }

      // Sort paths by expected profit and return the best one
      return paths.sort((a, b) => b.expectedProfit - a.expectedProfit)[0] || null;
    } finally {
      this.performanceMonitor.endTimer('pathFinding');
    }
  }

  private generatePaths(
    exchanges: string[],
    length: number,
    start: string
  ): string[][] {
    if (length === 1) return [[start]];
    
    const paths: string[][] = [];
    const remainingExchanges = exchanges.filter(e => e !== start);

    for (const exchange of remainingExchanges) {
      const subPaths = this.generatePaths(
        remainingExchanges.filter(e => e !== exchange),
        length - 1,
        exchange
      );
      paths.push(...subPaths.map(path => [start, ...path]));
    }

    return paths;
  }

  private async evaluatePath(
    path: string[],
    amount: number,
    priceData: PriceData
  ): Promise<ArbitragePath | null> {
    let currentAmount = amount;
    let totalFees = 0;
    const nodes: PathNode[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const currentExchange = path[i];
      const nextExchange = path[i + 1];

      const exchangeData = await this.getExchangeData(
        currentExchange,
        nextExchange,
        currentAmount,
        priceData
      );

      if (!exchangeData) return null;

      nodes.push({
        exchange: currentExchange,
        price: exchangeData.price,
        liquidity: exchangeData.liquidity,
        fees: exchangeData.fees
      });

      currentAmount = (currentAmount * exchangeData.price) * (1 - exchangeData.fees);
      totalFees += exchangeData.fees;
    }

    const expectedProfit = currentAmount - amount;
    const executionTime = this.performanceMonitor.getMetrics('pathFinding').avg;

    return {
      nodes,
      expectedProfit,
      totalFees,
      executionTime
    };
  }

  private async getExchangeData(
    fromExchange: string,
    toExchange: string,
    amount: number,
    priceData: PriceData
  ): Promise<{ price: number; liquidity: number; fees: number } | null> {
    // Mock implementation - replace with actual exchange data fetching
    return {
      price: priceData.dex,
      liquidity: Number(this.MIN_LIQUIDITY),
      fees: 0.001 // 0.1% fee
    };
  }
}