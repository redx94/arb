import { Logger } from '../monitoring';

const logger = Logger.getInstance();

export class ErrorHandler {
  private static instance: ErrorHandler;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `${context} attempt ${attempt} failed:`,
          error as Error
        );
        
        if (attempt < maxRetries) {
          const delay = this.calculateBackoff(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`${context} failed after ${maxRetries} attempts`);
    throw lastError;
  }

  private calculateBackoff(attempt: number): number {
    return this.INITIAL_DELAY * Math.pow(2, attempt - 1);
  }

  public handleError(error: Error, context: string): void {
    logger.error(`Error in ${context}:`, error);
    // Add additional error handling logic here
  }
}