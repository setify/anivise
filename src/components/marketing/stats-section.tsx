'use client'

import { useTranslations } from 'next-intl'
import { CountUp, FadeIn } from '@/components/marketing/motion'

export function StatsSection() {
  const t = useTranslations('landing.stats')

  const items = Array.from({ length: 4 }, (_, i) => ({
    value: Number(t(`items.${i}.value`)),
    suffix: t.has(`items.${i}.suffix`) ? t(`items.${i}.suffix`) : '',
    label: t(`items.${i}.label`),
  }))

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <div
                key={i}
                className={`px-6 py-4 text-center ${
                  i < items.length - 1 ? 'lg:border-r lg:border-border' : ''
                } ${i < 2 ? 'border-b border-border lg:border-b-0' : ''}`}
              >
                <div className="text-[3rem] font-bold leading-none tracking-tight text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <CountUp
                    end={item.value}
                    suffix={item.suffix}
                    duration={2.5}
                  />
                </div>
                <p className="mt-2 text-[0.8125rem] font-medium text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
