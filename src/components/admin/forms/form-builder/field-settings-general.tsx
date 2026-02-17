'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { FormField } from '@/types/form-schema'

interface FieldSettingsGeneralProps {
  field: FormField
  stepId: string
  onUpdate: (updates: Partial<FormField>) => void
}

export function FieldSettingsGeneral({ field, onUpdate }: FieldSettingsGeneralProps) {
  const t = useTranslations('admin.forms.builder.settings')

  const showPlaceholder = ['text', 'textarea', 'number', 'email', 'phone'].includes(field.type)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('label')}</Label>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={t('labelPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('description')}</Label>
        <Input
          value={field.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value || undefined })}
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      {showPlaceholder && (
        <div className="space-y-2">
          <Label>{t('placeholder')}</Label>
          <Input
            value={field.placeholder ?? ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
            placeholder={t('placeholderPlaceholder')}
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="required" className="cursor-pointer">
          {t('requiredField')}
        </Label>
        <Switch
          id="required"
          checked={field.required}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('defaultValue')}</Label>
        <Input
          value={String(field.defaultValue ?? '')}
          onChange={(e) =>
            onUpdate({
              defaultValue: e.target.value || undefined,
            })
          }
          placeholder={t('defaultValuePlaceholder')}
        />
      </div>
    </div>
  )
}
