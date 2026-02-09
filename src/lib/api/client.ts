import { API_CONFIG, RATE_LIMITS } from './config';
import { delay } from '@/lib/utils/common';
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  meta?: {
    pagination?: PaginationMeta;
    cache?: CacheMeta;
    rateLimit?: RateLimitMeta;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
  method?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CacheMeta {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
}

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
}
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  skipAuth?: boolean;
}
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = API_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  check(endpoint: string, config = RATE_LIMITS.API_CALLS): boolean {
    const now = Date.now();
    const key = `${endpoint}_${Math.floor(now / config.windowMs)}`;

    const current = this.requests.get(key) || { count: 0, resetTime: now + config.windowMs };

    if (current.count >= config.maxRequests) {
      throw new Error(`Rate limit exceeded for ${endpoint}. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`);
    }

    current.count++;
    this.requests.set(key, current);
    return true;
  }
}
export class ApiClient {
  private cache = new ApiCache();
  private rateLimiter = new RateLimiter();
  private baseURL = API_CONFIG.BASE_URL;

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      cache = method === 'GET',
      skipAuth = false
    } = options;
    this.rateLimiter.check(endpoint);
    const cacheKey = cache ? `${method}:${endpoint}:${JSON.stringify(body)}` : null;
    if (cache && cacheKey) {
      const cached = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cached) return cached;
    }
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (!skipAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              window.location.href = '/auth/login';
            }
          }

          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (cache && cacheKey && method === 'GET') {
          this.cache.set(cacheKey, result);
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && (
          error.message.includes('401') ||
          error.message.includes('400') ||
          error.message.includes('422')
        )) {
          break;
        }
        if (attempt < retries) {
          await delay(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Request failed after retries');
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern: string): void {
    this.cache.clear();
  }
}
export const apiClient = new ApiClient();
