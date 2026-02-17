'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authStore } from '@/lib/services/auth-client';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    form.clearErrors();

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        const msg = body?.message || 'Invalid credentials';
        setError(msg);
        authStore.setError(msg);
        toast.error('Login failed', {
          description: msg,
        });
        return;
      }

      const tokens = body.data;
      if (tokens?.accessToken && tokens?.refreshToken) {
        authStore.setTokens(tokens.accessToken, tokens.refreshToken);

        if (data.rememberMe && typeof window !== 'undefined') {
        }

        toast.success('Login successful!', {
          description: 'Welcome back!',
        });

        router.push('/studio');
      } else {
        const msg = 'Unexpected response from server';
        setError(msg);
        authStore.setError(msg);
        toast.error('Login failed', {
          description: msg,
        });
      }
    } catch (err) {
      const msg = 'Login failed. Please try again.';
      setError(msg);
      authStore.setError(msg);
      toast.error('Login failed', {
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="w-full">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400">
        <path d="M0 4.5C0 3.11929 1.11929 2 2.5 2H7.5C8.88071 2 10 3.11929 10 4.5V9.40959C10.0001 9.4396 10.0002 9.46975 10.0002 9.50001C10.0002 10.8787 11.1162 11.9968 12.4942 12C12.4961 12 12.4981 12 12.5 12H17.5C18.8807 12 20 13.1193 20 14.5V19.5C20 20.8807 18.8807 22 17.5 22H12.5C11.1193 22 10 20.8807 10 19.5V14.5C10 14.4931 10 14.4861 10.0001 14.4792C9.98891 13.1081 8.87394 12 7.50017 12C7.4937 12 7.48725 12 7.48079 12H2.5C1.11929 12 0 10.8807 0 9.5V4.5Z" fill="currentColor" />
      </svg>

      <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white md:text-4xl mt-4 text-left" style={{ fontFamily: 'var(--font-inter)' }}>
        Sign in to your account
      </h1>
      <p className="text-xs sm:text-sm font-medium tracking-tight text-zinc-400 md:text-sm lg:text-base mt-3 sm:mt-4 max-w-xl text-left leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
        We empower creators and artists to create, design, and manage AI-driven manga stories visually
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="h-full w-full rounded-2xl">
                <FormLabel className="text-zinc-300 dark:text-neutral-100" style={{ fontFamily: 'var(--font-inter)' }}>
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="mt-4 border border-zinc-700/60 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500/50"
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="h-full w-full rounded-2xl">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-zinc-300 dark:text-neutral-100" style={{ fontFamily: 'var(--font-inter)' }}>
                    Password
                  </FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    className="mt-4 border border-zinc-700/60 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500/50"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-zinc-300 dark:text-neutral-100 cursor-pointer" style={{ fontFamily: 'var(--font-inter)' }}>
                    Remember me
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm" style={{ fontFamily: 'var(--font-inter)' }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="block w-full rounded-xl px-6 py-2.5 sm:py-2 text-center text-sm font-medium transition duration-150 active:scale-[0.98] sm:text-base bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="mt-2 flex items-center">
            <div className="h-px flex-1 bg-zinc-700 dark:bg-neutral-700"></div>
            <span className="px-4 text-sm text-zinc-500 dark:text-neutral-400">or</span>
            <div className="h-px flex-1 bg-zinc-700 dark:bg-neutral-700"></div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          </div>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <span className="text-sm text-zinc-400 dark:text-neutral-400" style={{ fontFamily: 'var(--font-inter)' }}>
          Don't have an account?{' '}
        </span>
        <Link
          href="/auth/register"
          className="text-amber-400 text-sm font-medium hover:underline"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
