"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedShinyButton } from '@/components/ui/animated-shiny-button';
import { useAuthStore, authStore } from '@/lib/services/auth-client';

export function Header() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleSignOut = () => {
    // Clear tokens from localStorage and state
    authStore.clear();
    authStore.setError(null); // Clear any error messages
    // Redirect to home page
    router.push('/');
    router.refresh(); // Refresh to update UI state
  };

  return (
    <header className="h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-20 overflow-hidden rounded-lg border  bg-white flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Manga Studio logo"
              className="w-full h-full object-contain"
            />
          </div>
          {/* <span className="font-sans text-xl font-bold text-foreground">Manga Studio</span> */}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#gallery" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Gallery
          </Link>
          <Link href="#pricing" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/community" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Community
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/studio">Studio</Link>
            </Button>
            <AnimatedShinyButton
              url="/community"
              className="hidden sm:inline-flex text-xs sm:text-sm [--shiny-cta-highlight:#38bdf8] [--shiny-cta-highlight-subtle:#0ea5e9]"
            >
              <span style={{ fontFamily: 'var(--font-inter)' }}>Community</span>
            </AnimatedShinyButton>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <AnimatedShinyButton
              url="/community"
              className="hidden sm:inline-flex text-xs sm:text-sm [--shiny-cta-highlight:#38bdf8] [--shiny-cta-highlight-subtle:#0ea5e9]"
            >
              <span style={{ fontFamily: 'var(--font-inter)' }}>Community</span>
            </AnimatedShinyButton>
            <AnimatedShinyButton url="/auth/register" className="text-sm">
              <span style={{ fontFamily: 'var(--font-inter)' }}>Get Started</span>
            </AnimatedShinyButton>
          </>
        )}
      </div>
    </header>
  );
}
