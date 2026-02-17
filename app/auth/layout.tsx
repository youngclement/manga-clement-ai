'use client';

import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { TestimonialCard } from '@/components/auth/testimonial-card';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen px-4 sm:px-6 md:px-10 lg:px-20 xl:px-40 2xl:px-60 flex flex-col bg-zinc-950">
            <Header />
            <main className="flex-1">
                <div className="py-6 sm:py-10 md:py-20">
                    <div className="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2 lg:gap-20 xl:gap-40 md:items-stretch">
                        <div className="flex flex-col w-full max-w-md mx-auto md:mx-0 md:max-w-none">
                            {children}
                        </div>
                        <div className="hidden md:flex md:justify-end">
                            <div className="w-full">
                                <TestimonialCard />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
