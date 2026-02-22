import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export async function Footer() {
  const t = await getTranslations('landing')
  const locale = await getLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-foreground text-gray-300">
      {/* Gradient blob decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 size-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, oklch(0.57 0.12 280) 0%, transparent 70%)' }} />

      {/* Main footer content */}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/${locale}`} className="inline-block">
              <span className="text-2xl font-bold tracking-tight text-white">
                Anivise
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t('footer.product')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {t('nav.features')}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {t('nav.faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/impressum`}
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {t('nav.impressum')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/datenschutz`}
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {t('nav.datenschutz')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:kontakt@anivise.de"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <Mail className="size-4 shrink-0" />
                  kontakt@anivise.de
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-gray-500">
            {t('footer.copyright', { year })}
          </p>
          {/* Social media */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
              aria-label="LinkedIn"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
              aria-label="X (Twitter)"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
