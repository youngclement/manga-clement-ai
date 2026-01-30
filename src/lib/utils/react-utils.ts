import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { generateId } from './id';

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for stable callback references
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Memoize expensive computations
 */
export function useMemoized<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

/**
 * Safe array access with defaults
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Safe object access
 */
export function safeObject<T>(obj: T | undefined | null, defaultValue: T): T {
  return obj ?? defaultValue;
}

/**
 * Generate unique ID
 */
export { generateId };

/**
 * Normalize session data
 */
export function normalizeSession<T extends { chatHistory?: any[] }>(
  session: T
): T {
  return {
    ...session,
    chatHistory: safeArray(session.chatHistory),
  };
}

/**
 * Check if value is valid image ID (not base64 or URL)
 */
export function isImageId(url: string | undefined | null): boolean {
  if (!url) return false;
  return (
    !url.startsWith('data:image') &&
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    url.length < 200
  );
}

