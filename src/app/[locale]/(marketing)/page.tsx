import { HeroSection } from '@/components/marketing/hero-section'
import { LogoMarquee } from '@/components/marketing/logo-marquee'
import { StatsSection } from '@/components/marketing/stats-section'
import { DarkStatement } from '@/components/marketing/dark-statement'
import { FeatureShowcaseSection } from '@/components/marketing/feature-showcase-section'
import { ServicesSection } from '@/components/marketing/services-section'
import { CaseStudiesSection } from '@/components/marketing/case-studies-section'
import { TestimonialsSection } from '@/components/marketing/testimonials-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { CtaSection } from '@/components/marketing/cta-section'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoMarquee />
      <StatsSection />
      <DarkStatement />
      <FeatureShowcaseSection />
      <ServicesSection />
      <CaseStudiesSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
