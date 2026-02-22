'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const locale = useLocale()

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pt-44">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-[400px] w-[400px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          {/* Headline */}
          <h1
            className="hero-animate mx-auto max-w-4xl text-[clamp(2rem,7vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-foreground"
            style={{ animationDelay: '0ms' }}
          >
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p
            className="hero-animate mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            style={{ animationDelay: '150ms' }}
          >
            {t('subtitle')}
          </p>

          {/* CTAs */}
          <div
            className="hero-animate mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 text-base shadow-[0_4px_20px_oklch(from_var(--primary)_l_c_h/0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_oklch(from_var(--primary)_l_c_h/0.4)]"
            >
              <a href="#features">{t('ctaPrimary')}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base">
              <Link href={`/${locale}/register`}>{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </div>

        {/* Hero Mockup */}
        <div
          className="hero-animate hero-animate-scale relative mx-auto mt-16 max-w-[960px]"
          style={{ animationDelay: '500ms' }}
        >
          {/* Decorative corner dots */}
          <span className="absolute -left-[5px] -top-[5px] z-10 size-2.5 rounded-full border-2 border-border bg-white" />
          <span className="absolute -right-[5px] -top-[5px] z-10 size-2.5 rounded-full border-2 border-border bg-white" />
          <span className="absolute -bottom-[5px] -left-[5px] z-10 size-2.5 rounded-full border-2 border-border bg-white" />
          <span className="absolute -bottom-[5px] -right-[5px] z-10 size-2.5 rounded-full border-2 border-border bg-white" />

          <div className="overflow-hidden rounded-2xl border border-black/[0.08] shadow-[0_4px_8px_rgba(0,0,0,0.03),0_16px_40px_rgba(0,0,0,0.06),0_40px_80px_rgba(0,0,0,0.04)]">
            <Image
              src="/images/hero/hero-product.png"
              alt="Anivise Platform"
              width={1200}
              height={675}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
