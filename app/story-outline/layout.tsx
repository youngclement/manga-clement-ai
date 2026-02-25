'use client';

import { ReactNode } from 'react';
import { AppContainer } from '@/components/app/container';


export default function StoryOutlineLayout({
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
