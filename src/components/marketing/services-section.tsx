'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/marketing/motion'

export function ServicesSection() {
  const t = useTranslations('landing.services')

  const items = Array.from({ length: 8 }, (_, i) => ({
    title: t(`items.${i}.title`),
    image: t(`items.${i}.image`),
  }))

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <span className="section-badge">{t('title')}</span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('subtitle')}
          </h2>
        </FadeIn>

        <StaggerContainer staggerDelay={0.06} className="services-bento mt-12">
          {items.map((item, i) => (
            <StaggerItem key={i}>
              <div className="group relative h-full cursor-pointer overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-0 transition-all duration-[350ms] hover:-translate-y-1.5 hover:border-primary/15 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-white transition-transform duration-300 group-hover:-rotate-12">
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
