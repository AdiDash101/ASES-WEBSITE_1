import { AceStoriesSection } from "@/components/home/ace-stories-section";
import { AboutSection } from "@/components/home/about-section";
import { BuiltByAcesSection } from "@/components/home/built-by-aces-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { FlagshipEventsSection } from "@/components/home/flagship-events-section";
import { HeroSection } from "@/components/home/hero-section";
import { PartnersSection } from "@/components/home/partners-section";
import { PersonaSection } from "@/components/home/persona-section";
import { SocialGallerySection } from "@/components/home/social-gallery-section";
import { Footer } from "@/components/navigation/footer";
import { Navbar } from "@/components/navigation/navbar";
import { PagePreloader } from "@/components/page-preloader";

export default function HomePage() {
  return (
    <>
      <PagePreloader />
      <Navbar />

      <main>
        <HeroSection />
        <SocialGallerySection />
        <PartnersSection />
        <PersonaSection />
        <AboutSection />
        <FlagshipEventsSection />
        <BuiltByAcesSection />
        <AceStoriesSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </>
  );
}
