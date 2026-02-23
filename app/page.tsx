import { AnimatedMangaListSection } from '@/components/landing/animated-manga-list-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import { RecentCreationsSection } from '@/components/landing/recent-creations-section';
import { VideoDemoSection } from '@/components/landing/video-demo-section';

export default function LandingPage() {
    return (
        <div className="px-4 sm:px-10 lg:px-50">
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
