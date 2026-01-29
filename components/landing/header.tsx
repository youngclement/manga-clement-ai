"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedShinyButton } from '@/components/ui/animated-shiny-button';
import { useAuthStore, authStore } from '@/lib/services/auth-client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getMyProfile } from '@/lib/services/user-service';
import type { UserProfile } from '@/lib/types';
import { User, LogOut } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isAuthenticated) {
      getMyProfile().then(setProfile).catch(() => setProfile(null));
    } else {
      setProfile(null);
    }
  }, [isAuthenticated]);

  const handleSignOut = () => {
    // Clear tokens from localStorage and state
    authStore.clear();
    authStore.setError(null); // Clear any error messages
    setProfile(null);
    // Redirect to home page
    router.push('/');
    router.refresh(); // Refresh to update UI state
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
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
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/studio">Studio</Link>
            </Button>
            <AnimatedShinyButton
              url="/community"
              className="hidden sm:inline-flex text-xs sm:text-sm [--shiny-cta-highlight:#38bdf8] [--shiny-cta-highlight-subtle:#0ea5e9]"
            >
              <span style={{ fontFamily: 'var(--font-inter)' }}>Community</span>
            </AnimatedShinyButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none focus:outline-none">
                  <Avatar className="h-9 w-9 cursor-pointer border-2 border-zinc-700 hover:border-amber-400 transition-colors">
                    <AvatarImage src={profile?.avatarUrl} alt={profile?.displayName || profile?.username} />
                    <AvatarFallback className="bg-zinc-800 text-amber-400 text-sm font-semibold">
                      {profile ? getInitials(profile.displayName || profile.username) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">
                    {profile?.displayName || profile?.username || 'User'}
                  </p>
                  {profile?.username && profile?.displayName && (
                    <p className="text-xs text-zinc-400 truncate">@{profile.username}</p>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800"
                  onClick={() => router.push('/profile')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <AnimatedShinyButton
              url="/community"
              className="hidden sm:inline-flex text-xs sm:text-sm [--shiny-cta-highlight:#38bdf8] [--shiny-cta-highlight-subtle:#0ea5e9]"
            >
              <span style={{ fontFamily: 'var(--font-inter)' }}>Community</span>
            </AnimatedShinyButton>
            <Link href="/auth/login">
              <Avatar className="h-9 w-9 cursor-pointer border-2 border-zinc-700 hover:border-amber-400 transition-colors">
                <AvatarFallback className="bg-zinc-800 text-amber-400 text-sm font-semibold">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <AnimatedShinyButton url="/auth/register" className="text-sm">
              <span style={{ fontFamily: 'var(--font-inter)' }}>Get Started</span>
            </AnimatedShinyButton>
          </>
        )}
      </div>
    </header>
  );
}
