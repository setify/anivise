'use client'

import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/marketing/motion'

export function FaqSection() {
  const t = useTranslations('landing.faq')

  const items = Array.from({ length: 6 }, (_, i) => ({
    question: t(`items.${i}.question`),
    answer: t(`items.${i}.answer`),
  }))

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <span className="section-badge">{t('title')}</span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('subtitle')}
          </h2>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12">
          <div className="mx-auto max-w-[900px] rounded-3xl bg-muted/50 p-6 sm:p-10">
            <Accordion type="single" collapsible className="w-full space-y-3">
              <StaggerContainer staggerDelay={0.06}>
                {items.map((item, i) => (
                  <StaggerItem key={i}>
                    <AccordionItem
                      value={`item-${i}`}
                      className="overflow-hidden rounded-2xl border-none bg-white shadow-sm transition-shadow duration-300 data-[state=open]:shadow-md"
                    >
                      <AccordionTrigger className="px-6 py-5 text-left text-base font-medium text-foreground hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-5 leading-relaxed text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Accordion>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
