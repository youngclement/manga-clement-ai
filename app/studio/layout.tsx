'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppContainer } from '@/components/app/container';
import { useAuthStore } from '@/lib/services/auth-client';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      router.push('/auth/login');
    } else {
      setIsChecking(false);
    }
  }, [router, loadFromStorage]);
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-zinc-400 text-sm">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <AppContainer>
      {children}
    </AppContainer>
  );
}
