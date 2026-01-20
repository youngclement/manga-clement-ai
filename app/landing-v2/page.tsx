import { Header } from '@/components/landing/header';
import Hero from '@/components/landing/hero';

export default function LandingV2Page() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <main>
                <Hero />
            </main>
        </div>
    );
}

