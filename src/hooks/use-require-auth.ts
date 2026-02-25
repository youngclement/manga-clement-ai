'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/services/auth-client';


export function useRequireAuth() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  const requireAuth = useCallback((returnUrl?: string): boolean => {
    loadFromStorage();
    
    const currentToken = useAuthStore.getState().accessToken;
    
    if (!currentToken) {
      if (returnUrl && typeof window !== 'undefined') {
        sessionStorage.setItem('authReturnUrl', returnUrl);
      }
      router.push('/auth/login');
      return false;
    }
    
    return true;
  }, [router, loadFromStorage]);

 
  const checkAuth = useCallback((): boolean => {
    loadFromStorage();
    return !!useAuthStore.getState().accessToken;
  }, [loadFromStorage]);

  return {
    isAuthenticated,
    accessToken,
    requireAuth,
    checkAuth,
  };
}
