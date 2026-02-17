'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FormField, FieldConfig } from '@/types/form-schema'

interface FieldSettingsValidationProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}

export function FieldSettingsValidation({ field, onUpdate }: FieldSettingsValidationProps) {
  const t = useTranslations('admin.forms.builder.settings')

  const updateConfig = (updates: Partial<FieldConfig>) => {
    onUpdate({ config: { ...field.config, ...updates } as FieldConfig })
  }

  const updateValidation = (updates: Partial<FormField['validation']>) => {
    onUpdate({ validation: { ...field.validation, ...updates } })
  }

  return (
    <div className="space-y-4">
      {/* Text/Textarea fields */}
      {(field.type === 'text' || field.type === 'textarea') && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('minLength')}</Label>
              <Input
                type="number"
                min={0}
                value={(field.config as { minLength?: number }).minLength ?? ''}
                onChange={(e) =>
                  updateConfig({ minLength: e.target.value ? parseInt(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('maxLength')}</Label>
              <Input
                type="number"
                min={1}
                value={(field.config as { maxLength?: number }).maxLength ?? ''}
                onChange={(e) =>
                  updateConfig({ maxLength: e.target.value ? parseInt(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
          </div>
          {field.type === 'textarea' && (
            <div className="space-y-2">
              <Label>{t('rows')}</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={(field.config as { rows?: number }).rows ?? ''}
                onChange={(e) =>
                  updateConfig({ rows: e.target.value ? parseInt(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
          )}
        </>
      )}

      {/* Number field */}
      {field.type === 'number' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('min')}</Label>
              <Input
                type="number"
                value={(field.config as { min?: number }).min ?? ''}
                onChange={(e) =>
                  updateConfig({ min: e.target.value ? parseFloat(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('max')}</Label>
              <Input
                type="number"
                value={(field.config as { max?: number }).max ?? ''}
                onChange={(e) =>
                  updateConfig({ max: e.target.value ? parseFloat(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('step')}</Label>
              <Input
                type="number"
                min={0}
                value={(field.config as { step?: number }).step ?? ''}
                onChange={(e) =>
                  updateConfig({ step: e.target.value ? parseFloat(e.target.value) : undefined } as Partial<FieldConfig>)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('unit')}</Label>
              <Input
                value={(field.config as { unit?: string }).unit ?? ''}
                onChange={(e) =>
                  updateConfig({ unit: e.target.value || undefined } as Partial<FieldConfig>)
                }
                placeholder="e.g. kg, EUR"
              />
            </div>
          </div>
        </>
      )}

      {/* Date field */}
      {field.type === 'date' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('minDate')}</Label>
            <Input
              type="date"
              value={(field.config as { minDate?: string }).minDate ?? ''}
              onChange={(e) =>
                updateConfig({ minDate: e.target.value || undefined } as Partial<FieldConfig>)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('maxDate')}</Label>
            <Input
              type="date"
              value={(field.config as { maxDate?: string }).maxDate ?? ''}
              onChange={(e) =>
                updateConfig({ maxDate: e.target.value || undefined } as Partial<FieldConfig>)
              }
            />
          </div>
        </div>
      )}

      {/* CSAT field */}
      {field.type === 'csat' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('minLabel')}</Label>
            <Input
              value={(field.config as { minLabel?: string }).minLabel ?? ''}
              onChange={(e) =>
                updateConfig({ minLabel: e.target.value || undefined } as Partial<FieldConfig>)
              }
              placeholder={t('minLabelPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('maxLabel')}</Label>
            <Input
              value={(field.config as { maxLabel?: string }).maxLabel ?? ''}
              onChange={(e) =>
                updateConfig({ maxLabel: e.target.value || undefined } as Partial<FieldConfig>)
              }
              placeholder={t('maxLabelPlaceholder')}
            />
          </div>
        </div>
      )}

      {/* Rating field */}
      {field.type === 'rating' && (
        <div className="space-y-2">
          <Label>{t('ratingIcon')}</Label>
          <Select
            value={(field.config as { icon?: string }).icon ?? 'star'}
            onValueChange={(v) => updateConfig({ icon: v } as Partial<FieldConfig>)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="star">{t('iconStar')}</SelectItem>
              <SelectItem value="heart">{t('iconHeart')}</SelectItem>
              <SelectItem value="thumb">{t('iconThumb')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Regex pattern (all types) */}
      <details className="group">
        <summary className="text-muted-foreground cursor-pointer text-sm">{t('advancedValidation')}</summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label>{t('regexPattern')}</Label>
            <Input
              value={field.validation?.pattern ?? ''}
              onChange={(e) => updateValidation({ pattern: e.target.value || undefined })}
              placeholder="e.g. ^[A-Z].*"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('customError')}</Label>
            <Input
              value={field.validation?.customMessage ?? ''}
              onChange={(e) => updateValidation({ customMessage: e.target.value || undefined })}
              placeholder={t('customErrorPlaceholder')}
            />
          </div>
        </div>
      </details>
    </div>
  )
}
