import Hero from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features-section';
import { AutoContinueSection } from '@/components/landing/auto-continue-section';
import { RecentCreationsSection } from '@/components/landing/recent-creations-section';
import { AnimatedMangaListSection } from '@/components/landing/animated-manga-list-section';
import { HolographicShowcaseSection } from '@/components/landing/holographic-showcase-section';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
    return (
        <div className=" lg:px-50 sm:px-10 ">
            <Header />
            <Hero />
            <AutoContinueSection />
            <AnimatedMangaListSection />
            <HolographicShowcaseSection />
            <RecentCreationsSection />
            <FeaturesSection />
            <Footer />
        </div>
    );
}
