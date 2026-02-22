'use client'

import { useTranslations } from 'next-intl'
import { FadeIn } from '@/components/marketing/motion'

export function DarkStatement() {
  const t = useTranslations('landing.darkStatement')

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mx-auto max-w-[1200px] rounded-3xl bg-foreground px-8 py-16 text-center sm:px-16 sm:py-24 lg:px-24">
          <p className="mx-auto max-w-3xl text-[clamp(1.75rem,3.5vw,3rem)] font-bold leading-snug text-white">
            {t.rich('text', {
              highlight: (chunks) => (
                <span className="text-accent-foreground">{chunks}</span>
              ),
            })}
          </p>
        </div>
      </FadeIn>
    </section>
  )
}
