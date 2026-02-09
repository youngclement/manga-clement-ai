import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { generateId } from './id';

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

export function useMemoized<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function safeObject<T>(obj: T | undefined | null, defaultValue: T): T {
  return obj ?? defaultValue;
}

export { generateId };

export function normalizeSession<T extends { chatHistory?: any[]; pages?: any[] }>(
  session: T
): T {
  return {
    ...session,
    chatHistory: safeArray(session.chatHistory),
    pages: safeArray(session.pages),
  };
}

export function isImageId(url: string | undefined | null): boolean {
  if (!url) return false;
  return (
    !url.startsWith('data:image') &&
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    url.length < 200
  );
}
