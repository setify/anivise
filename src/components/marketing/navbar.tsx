'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { LocaleSwitcher } from '@/components/marketing/locale-switcher'

export function Navbar() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { href: '#features', label: t('features') },
    { href: '#faq', label: t('faq') },
  ]

  return (
    <header
      className={`fixed top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'left-0 w-full rounded-none border-b border-black/[0.06] bg-white/92 px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:px-10'
          : 'left-1/2 top-4 w-[min(92%,1100px)] -translate-x-1/2 rounded-full border border-white/25 bg-white/75 px-2 pl-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150'
      }`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div className={`mx-auto flex h-14 items-center justify-between ${scrolled ? 'max-w-6xl' : ''}`}>
        {/* Logo */}
        <Link href={`/${locale}`} className="flex shrink-0 items-center">
          <Image
            src="/logo_anivise.svg"
            alt="Anivise"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav - center */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link-animated relative text-sm font-[450] text-foreground transition-colors duration-200 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions - right */}
        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Button asChild variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">
            <Link href={`/${locale}/login`}>{t('login')}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full px-5 text-[0.8125rem] font-semibold shadow-[0_2px_12px_oklch(from_var(--primary)_l_c_h/0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_oklch(from_var(--primary)_l_c_h/0.35)]"
          >
            <Link href={`/${locale}/register`}>{t('register')}</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LocaleSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="my-2 border-border" />
                <Button asChild variant="ghost" className="justify-start">
                  <Link href={`/${locale}/login`} onClick={() => setOpen(false)}>
                    {t('login')}
                  </Link>
                </Button>
                <Button asChild className="justify-start rounded-full">
                  <Link href={`/${locale}/register`} onClick={() => setOpen(false)}>
                    {t('register')}
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
