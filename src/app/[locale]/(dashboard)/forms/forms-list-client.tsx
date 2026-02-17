'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ClipboardList, Check, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Form } from '@/types/database'

interface FormWithSubmission extends Form {
  lastSubmittedAt: Date | null
}

interface FormsListClientProps {
  forms: FormWithSubmission[]
}

export function FormsListClient({ forms }: FormsListClientProps) {
  const t = useTranslations('forms')
  const locale = useLocale()

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <ClipboardList className="text-muted-foreground mb-4 size-12" />
        <p className="text-muted-foreground text-sm">{t('noForms')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => {
        const isSubmitted = !!form.lastSubmittedAt

        return (
          <Link key={form.id} href={`/${locale}/forms/${form.slug}`}>
            <Card className="group relative h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{form.title}</CardTitle>
                  {isSubmitted ? (
                    <Badge variant="outline" className="shrink-0 gap-1 text-green-600 dark:text-green-400">
                      <Check className="size-3" />
                      {t('submitted')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      {t('notSubmitted')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {form.description && (
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                    {form.description}
                  </p>
                )}
                {isSubmitted && form.lastSubmittedAt && (
                  <p className="text-muted-foreground text-xs">
                    {t('submittedOn', { date: formatDate(form.lastSubmittedAt) })}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                  {isSubmitted ? t('viewSubmission') : t('fillOut')}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
