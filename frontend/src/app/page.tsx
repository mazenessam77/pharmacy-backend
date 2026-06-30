'use client';

import LanguageGate from '@/components/shared/LanguageGate';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import MedicineShowcase from '@/components/landing/MedicineShowcase';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import NewsCareersSection from '@/components/landing/NewsCareersSection';
import AboutSection from '@/components/landing/AboutSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main>
      <LanguageGate />
      <LandingNavbar />
      <HeroSection />
      <MedicineShowcase />
      <FeaturesSection />
      <HowItWorksSection />
      <NewsCareersSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </main>
  );
}
