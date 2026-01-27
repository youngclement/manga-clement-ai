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
        <div className="min-h-screen lg:px-60 sm:px-10 flex flex-col bg-zinc-950">
            <Header />
            <main className="flex-1">
                <div className="  py-10 md:py-20">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-40 md:items-stretch">
                        <div className="flex flex-col">
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

