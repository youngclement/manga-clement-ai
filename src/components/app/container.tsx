'use client';

import { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
