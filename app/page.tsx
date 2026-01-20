import { Header } from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features-section';

export default function LandingPage() {
    return (
        <div className="px-50 ">
            <Header />
            <Hero />
            <FeaturesSection />
        </div>
    );
}
