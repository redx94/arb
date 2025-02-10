import { Logger } from '../monitoring';
import { useAuth } from '../auth/authProvider';
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
      baseURL: !import.meta.vite_api_url ?"import.meta.vite_api_url" : 'http://localhost:3000',
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
    headers?: Record<string, string>
  ): Promise<any> {
    await this.rateLimiter.acquire();
    try {
      const auth = useAuth.getState();
      const token = auth.token || '';
      if (!token) {
        logger.warn('No auth token found. API calls may fail.');
      }
      const url = `${this.config.baseURL}/api/${this.config.version}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('API request failed:', error);
      throw error;
    }
  }

  public get<T>(endpoint: string, force: boolean): Promise<T> {
    return this.queryApi('GET', endpoint);
  }
  public post<T>(endpoint: string, data: any, force: boolean): Promise<T> {
    return this.queryApi( 'POST', endpoint, data );
  }
}

export { ApiClient }; 