'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/marketing/motion'

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials')
  const prefersReducedMotion = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const items = Array.from({ length: 6 }, (_, i) => ({
    quote: t(`items.${i}.quote`),
    name: t(`items.${i}.name`),
    role: t(`items.${i}.role`),
    avatar: t(`items.${i}.avatar`),
  }))

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % items.length)
  }, [items.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  // Auto-rotation with pause on hover
  useEffect(() => {
    if (prefersReducedMotion || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    intervalRef.current = setInterval(next, 6000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [next, prefersReducedMotion, paused])

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  const item = items[current]

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <span className="section-badge">{t('title')}</span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('subtitle')}
          </h2>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12">
          <div
            className="mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-foreground px-8 py-16 sm:px-16 sm:py-20"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative">
              {/* Large decorative quote mark */}
              <div className="pointer-events-none mb-8 text-center text-[6rem] font-serif leading-none text-white/10">
                &ldquo;
              </div>

              <div className="overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current}
                    custom={direction}
                    variants={prefersReducedMotion ? undefined : slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-center"
                  >
                    <blockquote className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300 sm:text-xl">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                    <div className="mt-10 flex flex-col items-center gap-3">
                      <Image
                        src={item.avatar}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="size-14 rounded-full object-cover ring-2 ring-white/10"
                      />
                      <div>
                        <p className="text-base font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-gray-400">{item.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prev}
                  className="rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="size-5" />
                  <span className="sr-only">Previous</span>
                </Button>

                {/* Dots */}
                <div className="flex items-center gap-2">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > current ? 1 : -1)
                        setCurrent(i)
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === current
                          ? 'w-6 bg-white'
                          : 'w-2 bg-gray-600 hover:bg-gray-400'
                      }`}
                    >
                      <span className="sr-only">Slide {i + 1}</span>
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="size-5" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
