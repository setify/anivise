'use client'

import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/marketing/motion'
import { Link } from '@/lib/i18n/navigation'

export function CtaSection() {
  const t = useTranslations('landing.cta')
  const locale = useLocale()

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="cta-glow relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center sm:px-16 sm:py-24 lg:px-24">
          <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-snug text-white">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-400">
            {t('subtitle')}
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="group rounded-full bg-white px-8 text-base font-semibold text-foreground shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              <Link href={`/${locale}/register`}>
                {t('button')}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
