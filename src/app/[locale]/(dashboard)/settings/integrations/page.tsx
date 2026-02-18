import { useTranslations } from 'next-intl'
import { Link2 } from 'lucide-react'
import { PagePlaceholder } from '@/components/ui/page-placeholder'

export default function SettingsIntegrationsPage() {
  const t = useTranslations('org.settingsIntegrations')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <PagePlaceholder message={t('comingSoon')} icon={Link2} />
    </div>
  )
}
