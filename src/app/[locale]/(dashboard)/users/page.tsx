import { useTranslations } from 'next-intl'
import { UserCog } from 'lucide-react'
import { PagePlaceholder } from '@/components/ui/page-placeholder'

export default function UsersPage() {
  const t = useTranslations('org.users')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <PagePlaceholder message={t('comingSoon')} icon={UserCog} />
    </div>
  )
}
