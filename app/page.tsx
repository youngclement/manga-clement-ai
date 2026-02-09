import Hero from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features-section';
import { AutoContinueSection } from '@/components/landing/auto-continue-section';
import { RecentCreationsSection } from '@/components/landing/recent-creations-section';
import { AnimatedMangaListSection } from '@/components/landing/animated-manga-list-section';
import { HolographicShowcaseSection } from '@/components/landing/holographic-showcase-section';
import { VideoDemoSection } from '@/components/landing/video-demo-section';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
    return (
        <div className=" lg:px-50 sm:px-10 ">
            <Header />
            <Hero />
            <VideoDemoSection 
                youtubeId="dQw4w9WgXcQ"
                title="See Manga Studio in Action"
                subtitle="Watch how easy it is to create stunning manga pages with AI in just minutes."
            />
            <AnimatedMangaListSection />
            <RecentCreationsSection />
            <FeaturesSection />
            <Footer />
        </div>
    );
}
