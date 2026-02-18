import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function SettingsGeneralPage() {
  const t = useTranslations('org.settingsGeneral')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="text-muted-foreground size-5" />
            <div>
              <CardTitle>{t('orgInfo')}</CardTitle>
              <CardDescription>{t('orgInfoDescription')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t('comingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
