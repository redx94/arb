import { EventEmitter } from 'events';
export class TradeQueue {
    constructor() {
        Object.defineProperty(this, "queue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "processing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "processQueueMutex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Promise.resolve()
        }); // Mutex lock
        Object.defineProperty(this, "eventEmitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new EventEmitter()
        });
        Object.defineProperty(this, "MAX_RETRIES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "RETRY_DELAY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    static getInstance() {
        if (!TradeQueue.instance) {
            TradeQueue.instance = new TradeQueue();
        }
        return TradeQueue.instance;
    }
    async addTrade(trade) {
        this.queue.push(trade);
        this.eventEmitter.emit('tradeAdded', trade);
        if (!this.processing) {
            this.processQueueMutex = this.processQueueMutex.then(() => this.processQueue());
        }
    }
    async processQueue() {
        if (this.processing || this.queue.length === 0)
            return;
        this.processing = true;
        return new Promise(resolve => {
            this.processQueueInner().then(resolve).finally(() => {
                this.processing = false;
            });
        });
    }
    async processQueueInner() {
        try {
            console.log('processQueueInner started. Queue length:', this.queue.length); // ADDED LOGGING
            console.log('Current queue:', this.queue.map(trade => trade.id)); // ADDED LOGGING
            +console.log('Before while loop in processQueueInner. Queue length:', this.queue.length); // ADDED LOGGING
            while (this.queue.length > 0) { // Loop while queue has elements
                const trade = this.queue[0];
                console.log('Processing trade:', trade.id, 'Queue length before executeTrade:', this.queue.length); // ADDED LOGGING
                +console.log('Inside while loop, processing trade:', trade.id); // ADDED LOGGING
                let retries = 0;
                let success = false;
                while (retries < this.MAX_RETRIES && !success) {
                    try {
                        const result = await this.executeTrade(trade);
                        if (result.success) {
                            success = true;
                            console.log('Before emitting tradeExecuted event'); // ADDED LOGGING
                            this.eventEmitter.emit('tradeExecuted', result);
                            console.log('After emitting tradeExecuted event'); // ADDED LOGGING
                        }
                        else {
                            retries++;
                            if (retries < this.MAX_RETRIES) {
                                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                            }
                        }
                    }
                    catch (error) {
                        retries++;
                        if (retries === this.MAX_RETRIES) {
                            this.eventEmitter.emit('tradeFailed', { trade, error });
                        }
                    }
                }
                this.queue.shift();
            }
        }
        finally {
            this.processing = false;
        }
    }
    async executeTrade(trade) {
        // Mock implementation for testing trade failures
        if (trade.id === 'fail') {
            throw new Error('Simulated trade execution failure for testing');
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate trade execution delay
        return {
            success: true,
            message: 'Trade executed successfully',
            trade
        };
    }
    getQueueLength() {
        return this.queue.length;
    }
    clearQueue() {
        this.queue = [];
        this.eventEmitter.emit('queueCleared');
    }
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
}
