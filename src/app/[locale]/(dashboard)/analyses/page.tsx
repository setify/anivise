import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Plus } from 'lucide-react'

export default function AnalysesPage() {
  const t = useTranslations('analyses')

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

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-1 text-lg font-medium">{t('emptyTitle')}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('empty')}</p>
          <Button variant="outline">
            <Plus className="size-4" />
            {t('newAnalysis')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
