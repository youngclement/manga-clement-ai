'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { LoadingPage } from '@/components/ui/loading';
import { NotificationContainer } from '@/components/ui/notification';
import { ModalContainer } from '@/components/ui/modal';
import { useRouter, usePathname } from 'next/navigation';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { isAuthenticated, isInitializing, checkAuth } = useAuthStore();
  const { setIsMobile, setTheme, theme } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth on app start
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Handle theme changes
  useEffect(() => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Handle route protection
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      const publicRoutes = ['/auth/login', '/auth/register', '/landing-v2', '/'];
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
      
      if (!isPublicRoute) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  // Show loading during initialization
  if (isInitializing) {
    return (
      <LoadingPage 
        title="Initializing Application"
        message="Setting up your workspace..."
      />
    );
  }

  return (
    <>
      {children}
      <NotificationContainer />
      <ModalContainer />
    </>
  );
}

// Hook to use store loading states in components
export function useStoreLoading() {
  const authLoading = useAuthStore(state => 
    state.loginLoading || state.registerLoading || state.profileLoading
  );
  
  const uiLoading = useUIStore(state => state.globalLoading);
  
  return {
    authLoading,
    uiLoading,
    isAnyLoading: authLoading || uiLoading
  };
}