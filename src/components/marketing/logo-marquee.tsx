'use client'

import { useTranslations } from 'next-intl'
import { FadeIn } from '@/components/marketing/motion'

const LOGOS = [
  'Logoipsum', 'Accenture', 'Waveline', 'Nextera', 'Prismify',
  'Synthetix', 'Orbital', 'Polaris',
]

export function LogoMarquee() {
  const t = useTranslations('landing.logoMarquee')

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <FadeIn>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t('title')}
        </p>
        <div className="marquee-container">
          <div className="marquee-track">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={i}
                className="mx-8 select-none whitespace-nowrap text-xl font-semibold text-foreground/20 transition-all duration-300 hover:text-foreground/50 sm:mx-12"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
