'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Create a Manga Studio account</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            autoComplete="new-password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition disabled:opacity-60"
                    >
                        {loading ? 'Creating account...' : 'Sign up'}
                    </button>
                </form>
            </div>
        </div>
    );
}


