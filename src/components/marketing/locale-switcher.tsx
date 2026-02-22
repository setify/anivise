'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const nextLocale = locale === 'de' ? 'en' : 'de'

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      className="text-xs font-medium uppercase"
    >
      {nextLocale}
    </Button>
  )
}
