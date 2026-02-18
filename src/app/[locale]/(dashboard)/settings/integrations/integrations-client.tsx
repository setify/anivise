'use client'

import { useTranslations } from 'next-intl'
import { Link2, Building2, Webhook, Key } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  supportEmail: string | null
}

export function IntegrationsClient({ supportEmail }: Props) {
  const t = useTranslations('org.settings.integrations')

  const integrations = [
    {
      icon: Building2,
      title: t('hrTitle'),
      description: t('hrDescription'),
    },
    {
      icon: Webhook,
      title: t('webhooksTitle'),
      description: t('webhooksDescription'),
    },
    {
      icon: Key,
      title: t('apiTitle'),
      description: t('apiDescription'),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex flex-col items-center py-8 text-center space-y-6">
        <div className="rounded-full bg-muted p-4">
          <Link2 className="size-8 text-muted-foreground" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('comingSoonTitle')}</h2>
          <p className="text-muted-foreground mt-1 text-sm max-w-md">{t('comingSoonDescription')}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full max-w-2xl text-left">
          {integrations.map((item) => (
            <Card key={item.title} className="opacity-60">
              <CardContent className="p-4 space-y-2">
                <item.icon className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Badge variant="secondary">🚧 {t('inDevelopment')}</Badge>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('notifyPrompt')}</p>
          {supportEmail ? (
            <Button variant="outline" asChild>
              <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(t('notifySubject'))}`}>
                {t('notifyButton')}
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled>{t('notifyButton')}</Button>
          )}
        </div>
      </div>
    </div>
  )
}
