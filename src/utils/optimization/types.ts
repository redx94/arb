export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    temperature: number;
    frequency: number;
  };
  memory: {
    used: number;
    available: number;
    swapUsage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    packetLoss: number;
  };
  system: {
    uptime: number;
    loadAverage: number;
    activeProcesses: number;
  };
}

export interface OptimizationAction {
  type: 'resource_adjustment' | 'scaling' | 'reallocation';
  target: keyof SystemMetrics;
  value: number;
  priority: number;
}

export interface ResourceAllocation {
  cpu: number;
  memory: number;
  network: number;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: SystemMetrics;
  anomalies: Array<{
    type: string;
    severity: number;
    metric: keyof SystemMetrics;
  }>;
  actions: OptimizationAction[];
  improvements: {
    [key in keyof SystemMetrics]?: number;
  };
}