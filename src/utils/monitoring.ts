export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private readonly METRICS_HISTORY_LIMIT = 1000;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startTimer(label: string): void {
    performance.mark(`${label}-start`);
  }

  public endTimer(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const duration = performance.getEntriesByName(label)[0].duration;
    this.recordMetric(label, duration);
    return duration;
  }

  public recordMetric(name: string, value: number): void {
    const values = this.metrics.get(name) || [];
    values.push(value);
    if (values.length > this.METRICS_HISTORY_LIMIT) {
      values.shift();
    }
    this.metrics.set(name, values);
  }

  public getMetrics(name: string): { avg: number; min: number; max: number } {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  public clearMetrics(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

export class Logger {
  private static instance: Logger;
  private logBuffer: { level: string; message: string; meta?: any; timestamp: Date }[] = [];
  private readonly BUFFER_SIZE = 1000;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    });
  }

  public info(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.bufferLog({ level: 'info', message, meta, timestamp: new Date() });
  }

  public error(message: string, error?: Error, meta?: any): void {
    const formattedMessage = this.formatMessage('error', message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
    console.error(formattedMessage);
    this.bufferLog({ level: 'error', message, meta: {error: error?.message, stack: error?.stack, ...meta}, timestamp: new Date() });
  }

  public warn(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.bufferLog({ level: 'warn', message, meta, timestamp: new Date() });
  }

  private bufferLog(log: { level: string; message: string; meta?: any; timestamp: Date }): void {
    this.logBuffer.push({ ...log, timestamp: new Date() });
    if (this.logBuffer.length > this.BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  public getLogs(): { level: string; message: string; meta?: any; timestamp: Date }[] {
    return [...this.logBuffer];
  }

  public clearLogs(): void {
    this.logBuffer = [];
  }
}
