import { Logger } from '../monitoring';
import { rateLimit } from './rateLimit';
const logger = Logger.getInstance();
class ApiClient {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rateLimiter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: rateLimit(100, 60000)
        }); // 100 requests per minute
        this.config = {
            baseURL: 'http://localhost:3000',
            version: 'v1',
            timeout: 10000,
        };
    }
    static getInstance() {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }
    async queryApi(method, endpoint, data, headers, token // Add optional token parameter
    ) {
        await this.rateLimiter.acquire();
        try {
            const url = `${this.config.baseURL}/api/${this.config.version}${endpoint}`;
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '', // Use the passed token
                    ...headers
                },
                body: data ? JSON.stringify(data) : undefined
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            logger.error('API request failed:', error);
            throw error;
        }
    }
    get(endpoint, _force, token) {
        return this.queryApi('GET', endpoint, undefined, undefined, token); // Pass token to queryApi
    }
    post(endpoint, data, _force, token) {
        return this.queryApi('POST', endpoint, data, undefined, token); // Pass token to queryApi
    }
}
export { ApiClient };
