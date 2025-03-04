import { Logger } from '../monitoring';
import { rateLimit } from './rateLimit';

const logger = Logger.getInstance();

interface ApiConfig {
  baseURL: string;
  version: string;
  timeout: number;
}

class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;
  private rateLimiter = rateLimit(100, 60000); // 100 requests per minute

  private constructor() {
    this.config = {
      baseURL: 'http://localhost:3000',
      version: 'v1',
      timeout: 10000,
    };
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async queryApi(
    method: string, 
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    token?: string // Add optional token parameter
  ): Promise<any> {
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
    } catch (error) {
      logger.error('API request failed:', error as Error);
      throw error;
    }
  }

  public get<T>(endpoint: string, _force: boolean, token?: string): Promise<T> { // Add optional token parameter
    return this.queryApi('GET', endpoint, undefined, undefined, token); // Pass token to queryApi
  }
  public post<T>(endpoint: string, data: any, _force: boolean, token?: string): Promise<T> { // Add optional token parameter
    return this.queryApi( 'POST', endpoint, data, undefined, token ); // Pass token to queryApi
  }
}

export { ApiClient };
