'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authStore } from '@/lib/services/auth-client';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Username and password are required');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '***REMOVED***';
            const res = await fetch(`${baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const body = await res.json().catch(() => null);

            if (!res.ok || !body?.success) {
                const msg = body?.message || 'Registration failed';
                setError(msg);
                authStore.setError(msg);
                setLoading(false);
                return;
            }

            const tokens = body.data;
            if (tokens?.accessToken && tokens?.refreshToken) {
                authStore.setTokens(tokens.accessToken, tokens.refreshToken);
                router.push('/studio');
            } else {
                const msg = 'Unexpected response from server';
                setError(msg);
                authStore.setError(msg);
            }
        } catch (err) {
            console.error(err);
            const msg = 'Registration failed. Please try again.';
            setError(msg);
            authStore.setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Logo SVG */}
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400">
                <path d="M0 4.5C0 3.11929 1.11929 2 2.5 2H7.5C8.88071 2 10 3.11929 10 4.5V9.40959C10.0001 9.4396 10.0002 9.46975 10.0002 9.50001C10.0002 10.8787 11.1162 11.9968 12.4942 12C12.4961 12 12.4981 12 12.5 12H17.5C18.8807 12 20 13.1193 20 14.5V19.5C20 20.8807 18.8807 22 17.5 22H12.5C11.1193 22 10 20.8807 10 19.5V14.5C10 14.4931 10 14.4861 10.0001 14.4792C9.98891 13.1081 8.87394 12 7.50017 12C7.4937 12 7.48725 12 7.48079 12H2.5C1.11929 12 0 10.8807 0 9.5V4.5Z" fill="currentColor" />
            </svg>

            {/* Heading */}
            <h1 className="text-3xl font-medium tracking-tight text-white md:text-4xl mt-4 text-left lg:text-4xl" style={{ fontFamily: 'var(--font-inter)' }}>
                Create an account
            </h1>
            <p className="text-sm font-medium tracking-tight text-zinc-400 md:text-sm lg:text-base mt-4 max-w-xl text-left" style={{ fontFamily: 'var(--font-inter)' }}>
                We empower creators and artists to create, design, and manage AI-driven manga stories visually
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
                <div className="h-full w-full rounded-2xl">
                    <label className="text-zinc-300 flex items-center gap-2 text-sm leading-none font-medium select-none dark:text-neutral-100" style={{ fontFamily: 'var(--font-inter)' }}>
                        Username
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm dark:bg-neutral-800 focus-visible:ring-amber-500/50 focus-visible:ring-[3px] mt-4 border border-zinc-700/60 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus:ring-amber-500/50"
                        placeholder="Choose a username"
                        autoComplete="username"
                        disabled={loading}
                    />
                </div>

                <div className="h-full w-full rounded-2xl">
                    <label className="text-zinc-300 flex items-center gap-2 text-sm leading-none font-medium select-none dark:text-neutral-100" style={{ fontFamily: 'var(--font-inter)' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm dark:bg-neutral-800 focus-visible:ring-amber-500/50 focus-visible:ring-[3px] mt-4 border border-zinc-700/60 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus:ring-amber-500/50"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        disabled={loading}
                    />
                </div>

                <div className="h-full w-full rounded-2xl">
                    <label className="text-zinc-300 flex items-center gap-2 text-sm leading-none font-medium select-none dark:text-neutral-100" style={{ fontFamily: 'var(--font-inter)' }}>
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm dark:bg-neutral-800 focus-visible:ring-amber-500/50 focus-visible:ring-[3px] mt-4 border border-zinc-700/60 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus:ring-amber-500/50"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !username || !password || !confirmPassword}
                    className="block rounded-xl px-6 py-2 text-center text-sm font-medium transition duration-150 active:scale-[0.98] sm:text-base bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-inter)' }}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating account...
                        </span>
                    ) : (
                        'Sign up'
                    )}
                </button>

                {/* Divider */}
                <div className="mt-2 flex items-center">
                    <div className="h-px flex-1 bg-zinc-700 dark:bg-neutral-700"></div>
                    <span className="px-4 text-sm text-zinc-500 dark:text-neutral-400">or</span>
                    <div className="h-px flex-1 bg-zinc-700 dark:bg-neutral-700"></div>
                </div>

                {/* Social Login Placeholder - Optional */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Placeholder buttons - can be implemented later */}
                </div>
            </form>

            {/* Footer Link */}
            <div className="mt-6 text-center">
                <span className="text-sm text-zinc-400 dark:text-neutral-400" style={{ fontFamily: 'var(--font-inter)' }}>
                    Already have an account?{' '}
                </span>
                <Link
                    href="/auth/login"
                    className="text-amber-400 text-sm font-medium hover:underline"
                    style={{ fontFamily: 'var(--font-inter)' }}
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
}


