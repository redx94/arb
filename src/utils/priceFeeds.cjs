"use strict";
const axios = require('axios');
const events_1 = require('events');
const monitoring_js_1 = require('./monitoring.cjs');

class PriceFeed extends events_1.EventEmitter {
   static instance;
   subscribers = {};
   mockMode = false;
   mockData = [];
   apiKey = process.env.COINGECKO_API_KEY || null;
   apiBaseUrl = 'https://api.coingecko.com/api/v3';
   logger = monitoring_js_1.Logger.getInstance();

   constructor() {
    super();
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
      Object.values(this.subscribers).forEach(callback => callback(data)); 
    } else {
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
      console.log('COINGECKO_API_KEY:', this.apiKey);
      const apiUrl = this.getApiUrl(`/coins/ethereum`, { vs_currency: 'usd' });
      console.log(`Fetching price from CoinGecko API for ${platform}:`, apiUrl);
      this.logger.info(`Fetching price from CoinGecko API for ${platform}: ${apiUrl}`);
      const response = await axios.get(apiUrl, {
        // Future: Authentication headers can be added here if needed.
      });
      console.log('CoinGecko API response:', response.data);
      this.logger.info(`CoinGecko API response for ${platform}: ${JSON.stringify(response.data)}`);
      if (!response.data || !response.data.market_data || !response.data.market_data.current_price || !response.data.market_data.current_price.usd) {
        const errorMessage = 'Invalid response format from CoinGecko API';
        console.error(errorMessage, 'Response data:', response.data);
        this.logger.error(errorMessage, response.data);
        console.error(errorMessage, 'Response data:', response.data);
        return null;
      }
      const price = Number(Math.round(response.data.market_data.current_price.usd));

      return {
        token: 'ETH',
        price: price,
        dex: platform === 'dex' ? price : 0, 
        cex: platform === 'cex' ? price : 0, 
        timestamp: Date.now(),
        platform: platform, 
        amount: 1,
      };
    } catch (error) {
      console.error(`Failed to fetch price from CoinGecko API for ${platform}:`, error);
      this.emit('error', `Failed to fetch price from CoinGecko API for ${platform}`, error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`CoinGecko API error for ${platform}: ${error.response.status} ${error.response.statusText}`, error.response.data);
        return null;
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error(`No response received from CoinGecko API for historical data: ${error.message}`);
        return null;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(`Error setting up CoinGecko API request for historical data: ${error.message}`);
        return null;
      }
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
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`CoinGecko API error for historical data: ${error.response.status} ${error.response.statusText}`, error.response.data);
        return null;
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error(`No response received from CoinGecko API for historical data: ${error.message}`);
        return null;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(`Error setting up CoinGecko API request for historical data: ${error.message}`);
        return null;
      }
    }
  }

   async getDexLiquidity() {
    try {
      // TODO: Implement logic to fetch DEX liquidity from a reliable source (e.g., Uniswap V2 pair contract) - Phase 2 - Gemini AI
      this.logger.warn('DEX liquidity is currently a mock value. Implement the actual logic to fetch DEX liquidity.');
      return 1000 + Math.random() * 1000;
    } catch (error) {
      this.logger.error('Failed to get DEX liquidity:', error);
      return 0;
    }
  }
}

module.exports = { PriceFeed };
