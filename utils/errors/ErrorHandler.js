import { Logger } from '../monitoring';
const logger = Logger.getInstance();
export class ErrorHandler {
    constructor() {
        Object.defineProperty(this, "MAX_RETRIES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "INITIAL_DELAY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    async withRetry(operation, context, maxRetries = this.MAX_RETRIES) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                logger.warn(`${context} attempt ${attempt} failed:`, error);
                if (attempt < maxRetries) {
                    const delay = this.calculateBackoff(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        logger.error(`${context} failed after ${maxRetries} attempts`);
        throw lastError;
    }
    calculateBackoff(attempt) {
        return this.INITIAL_DELAY * Math.pow(2, attempt - 1);
    }
    handleError(error, context) {
        logger.error(`Error in ${context}:`, error);
        // Add additional error handling logic here
    }
}
