import axios from 'axios';
import { EventEmitter } from 'events';

export class PriceFeed extends EventEmitter {
    constructor(source) {
        super();
        Object.defineProperty(this, "subscribers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "mockMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "mockData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.COINGECKO_API_KEY || null
        });
        Object.defineProperty(this, "apiBaseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'https://api.coingecko.com/api/v3'
        });
        Object.defineProperty(this, "source", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: source
        });
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "cacheTimestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "cacheDuration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 60000 // 1 minute
        });
    }

    static getInstance(source) {
        if (!PriceFeed.instance) {
            PriceFeed.instance = new PriceFeed(source);
        }
        return PriceFeed.instance;
    }

    setMockMode(enabled) {
        this.mockMode = enabled;
    }

    subscribe(callback) {
        const id = Math.random().toString(36).substr(2, 9);
        this.subscribers[id] = callback;
        return () => delete this.subscribers[id];
    }

    updatePrice(data) {
        if (this.mockMode) {
            this.mockData.push(data);
            Object.values(this.subscribers).forEach(callback => callback(data)); // Still notify subscribers
        } else {
            Object.values(this.subscribers).forEach(callback => callback(data));
        }
    }

    getMockData() {
        return this.mockData;
    }

    unsubscribe(callback) {
        this.subscribers = Object.fromEntries(Object.entries(this.subscribers).filter(([, func]) => func !== callback));
    }

    getApiUrl(endpoint, params) {
        let url = `${this.apiBaseUrl}${endpoint}`;
        const allParams = { ...params };
        if (this.apiKey) {
            allParams['api_key'] = this.apiKey;
        }
        const queryParams = new URLSearchParams(allParams).toString();
        return queryParams ? `${url}?${queryParams}` : url;
    }

    async getCurrentPrice() {
        if (this.mockMode) {
            return this.mockData.length > 0 ? this.mockData[this.mockData.length - 1] : null;
        }

        const now = Date.now();
        if (this.cache && now - this.cacheTimestamp < this.cacheDuration) {
            return this.cache;
        }

        try {
            const apiUrl = this.getApiUrl('/simple/price', { ids: 'ethereum', vs_currencies: 'usd' });
            console.log('Fetching price from CoinGecko API:', apiUrl);
            const response = await axios.get(apiUrl, {
                // Future: Authentication headers can be added here if needed.
            });
            console.log('CoinGecko API response:', response.data);

            if (!response.data || !response.data.ethereum || !response.data.ethereum.usd) {
                const errorMessage = 'Invalid response format from CoinGecko API';
                console.error(errorMessage, 'Response data:', response.data); // Include response data in error log
                this.emit('error', errorMessage, response.data);
                return null;
            }

            const data = response.data.ethereum;
            const price = data.usd;
            this.cache = {
                token: 'ETH',
                price: price,
                dex: price,
                cex: price,
                timestamp: now,
                amount: 1,
                source: this.source,
            };
            this.cacheTimestamp = now;
            return this.cache;
        } catch (error) {
            console.error('Failed to fetch price from CoinGecko API:', error);
            this.emit('error', 'Failed to fetch price from CoinGecko API', error);
            return null;
        }
    }

    async getHistoricalPrice(days = 30) {
        try {
            const apiUrl = this.getApiUrl(`/coins/ethereum/market_chart`, { vs_currency: 'usd', days: days.toString() });
            console.log('Fetching historical price from CoinGecko API:', apiUrl);
            const response = await axios.get(apiUrl, {
                // Future: Authentication headers can be added here if needed.
            });
            console.log('CoinGecko API response:', response.data);

            if (!response.data || !response.data.prices) {
                const errorMessage = 'Invalid response format from CoinGecko API for historical data';
                console.error(errorMessage, 'Response data:', response.data); // Include response data in error log
                this.emit('error', errorMessage, response.data);
                return null;
            }

            return response.data.prices;
        } catch (error) {
            console.error('Failed to fetch historical price from CoinGecko API:', error);
            this.emit('error', 'Failed to fetch historical price from CoinGecko API', error);
            return null;
        }
    }
}
// Future improvements:
// 1. Implement authentication handling for APIs that require it.
//    - This could involve adding methods to set and manage API keys or tokens.
//    - Consider using a dedicated API client for handling authentication logic.
// 2. Add more comprehensive error handling and logging throughout the application.
//    - Implement centralized error handling and logging mechanisms.
//    - Provide more context in error messages and logs for easier debugging.
// 3. Implement more robust input validation and data sanitization.
//    - Validate inputs to prevent unexpected issues and security vulnerabilities.
// 4. Add unit and integration tests.
//    - Write tests to cover different parts of the codebase and ensure functionality.
// Example usage:
// const priceFeed = PriceFeed.getInstance();
// priceFeed.on('error', (message, error) => {
//   console.error('PriceFeed Error:', message, error);
// });
// priceFeed.subscribe((data) => {
//   console.log('Price Update:', data);
// });
// priceFeed.getCurrentPrice().then(price => {
//   console.log('Current Price:', price);
// });
