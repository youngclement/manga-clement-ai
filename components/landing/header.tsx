"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedShinyButton } from '@/components/ui/animated-shiny-button';

export function Header() {
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
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <AnimatedShinyButton url="/studio" className="text-sm">
          <span style={{ fontFamily: 'var(--font-inter)' }}>Start Creating</span>
        </AnimatedShinyButton>
      </div>
    </header>
  );
}
