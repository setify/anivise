'use client'

import { useTranslations } from 'next-intl'
import { GripVertical, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { FormField, FieldOption, RadioFieldConfig, CheckboxFieldConfig } from '@/types/form-schema'

interface FieldSettingsOptionsProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function FieldSettingsOptions({ field, onUpdate }: FieldSettingsOptionsProps) {
  const t = useTranslations('admin.forms.builder.settings')
  const config = field.config as RadioFieldConfig | CheckboxFieldConfig
  const options = config.options ?? []

  const updateOptions = (newOptions: FieldOption[]) => {
    onUpdate({ config: { ...config, options: newOptions } as typeof config })
  }

  const addOption = () => {
    const newId = crypto.randomUUID()
    updateOptions([
      ...options,
      { id: newId, label: '', value: '' },
    ])
  }

  const updateOption = (id: string, updates: Partial<FieldOption>) => {
    updateOptions(
      options.map((o) => {
        if (o.id !== id) return o
        const updated = { ...o, ...updates }
        // Auto-generate value from label if value wasn't explicitly changed
        if (updates.label && !updates.value) {
          updated.value = slugify(updates.label)
        }
        return updated
      })
    )
  }

  const removeOption = (id: string) => {
    updateOptions(options.filter((o) => o.id !== id))
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">{t('options')}</Label>
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <GripVertical className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={option.label}
                onChange={(e) => updateOption(option.id, { label: e.target.value })}
                placeholder={t('optionLabel')}
                className="flex-1"
              />
              <Input
                value={option.value}
                onChange={(e) => updateOption(option.id, { value: e.target.value })}
                placeholder={t('optionValue')}
                className="w-32"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => removeOption(option.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-1"
          onClick={addOption}
        >
          <Plus className="size-3.5" />
          {t('addOption')}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="allow-other" className="cursor-pointer">
          {t('allowOther')}
        </Label>
        <Switch
          id="allow-other"
          checked={config.allowOther ?? false}
          onCheckedChange={(checked) =>
            onUpdate({ config: { ...config, allowOther: checked } as typeof config })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>{t('displayVariant')}</Label>
        <div className="flex gap-2">
          {(['default', 'buttons'] as const).map((variant) => (
            <Button
              key={variant}
              variant={field.displayVariant === variant || (!field.displayVariant && variant === 'default') ? 'default' : 'outline'}
              size="sm"
              onClick={() => onUpdate({ displayVariant: variant })}
            >
              {t(`variants.${variant}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
