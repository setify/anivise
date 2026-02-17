import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { BarChart3, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AnalysesPage() {
  const t = useTranslations('analyses')
  const tEmpty = useTranslations('ui.empty.analyses')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button>
          <Plus className="size-4" />
          {t('newAnalysis')}
        </Button>
      </div>

      <EmptyState
        icon={BarChart3}
        title={tEmpty('title')}
        description={tEmpty('description')}
        action={{
          label: tEmpty('action'),
          icon: Plus,
        }}
      />
    </div>
  )
}
