'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/marketing/motion'

export function FeatureShowcaseSection() {
  const t = useTranslations('landing.featureShowcase')

  const steps = Array.from({ length: 3 }, (_, i) => ({
    title: t(`steps.${i}.title`),
    description: t(`steps.${i}.description`),
  }))

  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <FadeIn className="text-center">
          <span className="section-badge">
            {t('badge')}
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </FadeIn>

        {/* Two-column layout: image + steps */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          {/* Feature image */}
          <FadeIn direction="left">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-2">
              <Image
                src="/images/features/feature-voice.png"
                alt="Feature showcase"
                width={800}
                height={500}
                className="h-auto w-full rounded-xl"
              />
            </div>
          </FadeIn>

          {/* Steps with dashed connection line */}
          <div>
            <FadeIn direction="right">
              <p className="mb-8 text-sm font-medium text-muted-foreground">
                {t('highlight')}
              </p>
            </FadeIn>

            <StaggerContainer staggerDelay={0.15} className="relative space-y-8">
              {/* Dashed connection line */}
              <div className="absolute bottom-9 left-[18px] top-9 w-px border-l-2 border-dashed border-border" />

              {steps.map((step, i) => (
                <StaggerItem key={i}>
                  <div className="relative flex gap-4">
                    <div className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>

        {/* Second feature image — full width */}
        <FadeIn className="mt-20">
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-lg">
            <Image
              src="/images/features/feature-files.png"
              alt="Platform features"
              width={1200}
              height={590}
              className="h-auto w-full"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
