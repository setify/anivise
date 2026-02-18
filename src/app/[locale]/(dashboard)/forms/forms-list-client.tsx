'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ClipboardList, Check, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.description')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.submittedAt')}</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => {
              const isSubmitted = !!form.lastSubmittedAt

              return (
                <TableRow key={form.id}>
                  <TableCell>
                    <span className="font-medium">{form.title}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground line-clamp-1 text-sm">
                      {form.description || '–'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isSubmitted ? (
                      <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400">
                        <Check className="size-3" />
                        {t('submitted')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('notSubmitted')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {isSubmitted && form.lastSubmittedAt
                        ? formatDate(form.lastSubmittedAt)
                        : '–'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/${locale}/forms/${form.slug}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        {isSubmitted ? t('viewSubmission') : t('fillOut')}
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
