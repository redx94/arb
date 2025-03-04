import axios from 'axios';
import { EventEmitter } from 'events';
export class PriceFeed extends EventEmitter {
    constructor() {
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
    }
    static getInstance() {
        if (!PriceFeed.instance) {
            PriceFeed.instance = new PriceFeed();
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
        }
        else {
            Object.values(this.subscribers).forEach(callback => callback(data));
        }
    }
    getMockData() {
        return this.mockData;
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
    async getCurrentPrice(platform) {
        try {
            const apiUrl = this.getApiUrl('/simple/price', { ids: 'ethereum', vs_currencies: 'usd' });
            console.log(`Fetching price from CoinGecko API for ${platform}:`, apiUrl);
            const response = await axios.get(apiUrl, {
            // Future: Authentication headers can be added here if needed.
            });
            console.log('CoinGecko API response:', response.data);
            if (!response.data || !response.data.ethereum || !response.data.ethereum.usd) {
                const errorMessage = 'Invalid response format from CoinGecko API';
                console.error(errorMessage, 'Response data:', response.data);
                this.emit('error', errorMessage, response.data);
                return null;
            }
            const data = response.data.ethereum;
            const price = data.usd;
            return {
                token: 'ETH',
                price: price,
                dex: platform === 'dex' ? price : 0, // Assign price based on platform
                cex: platform === 'cex' ? price : 0, // Assign price based on platform
                timestamp: Date.now(),
                platform: platform, // Set the platform
                amount: 1,
            };
        }
        catch (error) {
            console.error(`Failed to fetch price from CoinGecko API for ${platform}:`, error);
            this.emit('error', `Failed to fetch price from CoinGecko API for ${platform}`, error);
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
        }
        catch (error) {
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
