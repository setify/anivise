'use client'

import { useTranslations } from 'next-intl'
import { Star, ThumbsUp, Heart } from 'lucide-react'
import type { FormSchema, FormField, FieldOption } from '@/types/form-schema'

interface FormResponsesViewProps {
  data: Record<string, unknown>
  schema: Record<string, unknown> | null
  submittedAt: Date | null
}

export function FormResponsesView({
  data,
  schema,
  submittedAt,
}: FormResponsesViewProps) {
  const t = useTranslations('analyses.detail.forms.responses')

  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        {t('noResponses')}
      </p>
    )
  }

  // Parse schema to map field IDs to labels
  const parsedSchema = schema as unknown as FormSchema | null
  const fieldMap = new Map<string, FormField>()
  if (parsedSchema?.steps) {
    for (const step of parsedSchema.steps) {
      for (const field of step.fields) {
        fieldMap.set(field.id, field)
      }
    }
  }

  function renderValue(fieldId: string, value: unknown): React.ReactNode {
    const field = fieldMap.get(fieldId)
    if (!field) {
      // Fallback: just display raw value
      if (Array.isArray(value)) return value.join(', ')
      return String(value ?? '-')
    }

    switch (field.config.type) {
      case 'rating': {
        const numVal = Number(value) || 0
        const maxStars = field.config.maxStars || 5
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: maxStars }, (_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < numVal
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="text-muted-foreground ml-1 text-xs">
              ({numVal}/{maxStars})
            </span>
          </div>
        )
      }

      case 'csat': {
        const csatVal = Number(value) || 0
        return (
          <span className="font-medium">{csatVal}/10</span>
        )
      }

      case 'radio': {
        const options = (field.config as { options?: FieldOption[] }).options ?? []
        const selected = options.find((o) => o.value === value)
        return selected?.label ?? String(value ?? '-')
      }

      case 'checkbox': {
        const options = (field.config as { options?: FieldOption[] }).options ?? []
        const selectedValues = Array.isArray(value) ? value : []
        const labels = selectedValues
          .map((v) => {
            const opt = options.find((o) => o.value === v)
            return opt?.label ?? String(v)
          })
          .join(', ')
        return labels || '-'
      }

      case 'date': {
        if (!value) return '-'
        try {
          return new Date(String(value)).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        } catch {
          return String(value)
        }
      }

      case 'hidden':
        return null

      default: {
        if (Array.isArray(value)) return value.join(', ')
        return String(value ?? '-')
      }
    }
  }

  const entries = Object.entries(data).filter(([fieldId]) => {
    const field = fieldMap.get(fieldId)
    return !field || field.config.type !== 'hidden'
  })

  return (
    <div className="space-y-3">
      {submittedAt && (
        <p className="text-muted-foreground text-xs">
          {t('submittedAt', {
            date: new Date(submittedAt).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
        </p>
      )}
      <div className="space-y-2">
        {entries.map(([fieldId, value]) => {
          const field = fieldMap.get(fieldId)
          const label = field?.label ?? fieldId
          const rendered = renderValue(fieldId, value)
          if (rendered === null) return null

          return (
            <div key={fieldId} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs font-medium">
                {label}
              </span>
              <span className="text-sm">{rendered}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
