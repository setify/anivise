import { useTranslations } from 'next-intl'
import { Image } from 'lucide-react'
import { PagePlaceholder } from '@/components/ui/page-placeholder'

export default function SettingsMediaPage() {
  const t = useTranslations('org.settingsMedia')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <PagePlaceholder message={t('comingSoon')} icon={Image} />
    </div>
  )
}
