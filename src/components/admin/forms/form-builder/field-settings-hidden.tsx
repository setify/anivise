'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FormField, HiddenFieldConfig } from '@/types/form-schema'

interface FieldSettingsHiddenProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}

export function FieldSettingsHidden({ field, onUpdate }: FieldSettingsHiddenProps) {
  const t = useTranslations('admin.forms.builder.settings')
  const config = field.config as HiddenFieldConfig

  const updateConfig = (updates: Partial<HiddenFieldConfig>) => {
    onUpdate({ config: { ...config, ...updates } })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('sourceType')}</Label>
        <Select
          value={config.sourceType ?? 'fixed'}
          onValueChange={(v) =>
            updateConfig({ sourceType: v as 'fixed' | 'url_param' | 'user_field' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">{t('sourceFixed')}</SelectItem>
            <SelectItem value="url_param">{t('sourceUrlParam')}</SelectItem>
            <SelectItem value="user_field">{t('sourceUserField')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.sourceType === 'fixed' || !config.sourceType) && (
        <div className="space-y-2">
          <Label>{t('fixedValue')}</Label>
          <Input
            value={config.fixedValue ?? ''}
            onChange={(e) => updateConfig({ fixedValue: e.target.value || undefined })}
          />
        </div>
      )}

      {config.sourceType === 'url_param' && (
        <div className="space-y-2">
          <Label>{t('parameterName')}</Label>
          <Input
            value={config.sourceKey ?? ''}
            onChange={(e) => updateConfig({ sourceKey: e.target.value || undefined })}
            placeholder="e.g. utm_source"
          />
        </div>
      )}

      {config.sourceType === 'user_field' && (
        <div className="space-y-2">
          <Label>{t('userField')}</Label>
          <Select
            value={config.sourceKey ?? ''}
            onValueChange={(v) => updateConfig({ sourceKey: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectUserField')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{t('userEmail')}</SelectItem>
              <SelectItem value="name">{t('userName')}</SelectItem>
              <SelectItem value="organization">{t('userOrganization')}</SelectItem>
              <SelectItem value="role">{t('userRole')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
