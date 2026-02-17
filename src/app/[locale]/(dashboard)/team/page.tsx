import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Users, UserPlus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function TeamPage() {
  const t = useTranslations('team')
  const tEmpty = useTranslations('ui.empty.team')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button>
          <UserPlus className="size-4" />
          {t('invite')}
        </Button>
      </div>

      <EmptyState
        icon={Users}
        title={tEmpty('title')}
        description={tEmpty('description')}
        action={{
          label: tEmpty('action'),
          icon: UserPlus,
        }}
      />
    </div>
  )
}
