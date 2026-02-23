'use client';

import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-4 sm:px-10 lg:px-60 flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
