import { Header } from '@/components/landingzz/header';
import { Hero } from '@/components/landingzz/hero';
import { Features } from '@/components/landingzz/features';
import { Showcase } from '@/components/landingzz/showcase';
import { CTA } from '@/components/landingzz/cta';
import { Footer } from '@/components/landingzz/footer';

export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Showcase />
      <CTA />
      <Footer />
    </>
  );
}
