'use client';

import { ReactNode } from 'react';
import { AppContainer } from '@/components/app/container';

/**
 * Studio layout - allows free access to all routes.
 * Authentication is only required when generating images.
 */
export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppContainer>
      {children}
    </AppContainer>
  );
}
