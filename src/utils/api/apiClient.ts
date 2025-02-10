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
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      version: 'v1',
      timeout: 10000
    };
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    await this.rateLimiter.acquire();

    try {
      const auth = useAuth.getState();
      const url = `${this.config.baseURL}/api/${this.config.version}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.token ? `Bearer ${auth.token}` : '',
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

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  public post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, headers);
  }

  public put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, headers);
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }
}
