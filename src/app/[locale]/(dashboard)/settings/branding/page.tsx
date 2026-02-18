import { useTranslations } from 'next-intl'
import { Palette } from 'lucide-react'
import { PagePlaceholder } from '@/components/ui/page-placeholder'

export default function BrandingPage() {
  const t = useTranslations('org.settingsBranding')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <PagePlaceholder message={t('comingSoon')} icon={Palette} />
    </div>
  )
}
