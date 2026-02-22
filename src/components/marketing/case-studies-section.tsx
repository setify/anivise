'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/marketing/motion'

export function CaseStudiesSection() {
  const t = useTranslations('landing.caseStudies')

  const items = Array.from({ length: 4 }, (_, i) => ({
    title: t(`items.${i}.title`),
    image: t(`items.${i}.image`),
  }))

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Button variant="outline" className="group rounded-full">
              {t('viewAll')}
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </FadeIn>
        </div>

        <FadeIn delay={0.1} className="mt-12">
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item, i) => (
              <div
                key={i}
                className="group w-[320px] flex-none cursor-pointer snap-start overflow-hidden rounded-[20px] border border-black/[0.06] bg-white transition-all duration-[350ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={640}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
