/**
 * Standardized error handling utilities
 */

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

export class AppError extends Error {
  code?: string;
  details?: any;
  timestamp: number;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
}

/**
 * Handle API errors consistently
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'An error occurred';
  let errorDetails: any = null;

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || errorMessage;
    errorDetails = errorData.details || null;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  throw new AppError(errorMessage, `HTTP_${response.status}`, errorDetails);
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    console.error('Operation failed:', errorMessage, error);
    
    if (onError) {
      onError(error);
    }
    
    return fallback ?? null;
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

