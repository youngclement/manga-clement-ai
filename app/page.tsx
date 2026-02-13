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
                youtubeId="gFHGGryWHxw"
                title="How to Create Manga with AI Studio"
                subtitle="Create your own manga with AI - no drawing skills required. Learn everything from starting a new project to generating stunning manga pages."
            />
            <AnimatedMangaListSection />
            <RecentCreationsSection />
            <FeaturesSection />
            <Footer />
        </div>
    );
}
