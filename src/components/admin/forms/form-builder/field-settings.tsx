'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FormField } from '@/types/form-schema'
import type { BuilderAction } from './builder-types'
import { FIELD_TYPE_DEFINITIONS } from './builder-types'
import { FieldSettingsGeneral } from './field-settings-general'
import { FieldSettingsOptions } from './field-settings-options'
import { FieldSettingsValidation } from './field-settings-validation'
import { FieldSettingsLogic } from './field-settings-logic'
import { FieldSettingsHidden } from './field-settings-hidden'

interface FieldSettingsProps {
  field: FormField | null
  stepId: string
  allFields: FormField[]
  dispatch: React.Dispatch<BuilderAction>
}

export function FieldSettings({ field, stepId, allFields, dispatch }: FieldSettingsProps) {
  const t = useTranslations('admin.forms.builder')

  if (!field) {
    return (
      <div className="bg-card flex h-full w-80 flex-col border-l shadow-sm">
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground text-center text-sm">
            {t('selectFieldHint')}
          </p>
        </div>
      </div>
    )
  }

  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === field.type)
  const FieldIcon = def?.icon
  const hasOptions = field.type === 'radio' || field.type === 'checkbox'
  const isHidden = field.type === 'hidden'

  const handleUpdate = (updates: Partial<FormField>) => {
    dispatch({
      type: 'UPDATE_FIELD',
      stepId,
      fieldId: field.id,
      updates,
    })
  }

  return (
    <div className="bg-card flex h-full w-80 flex-col border-l shadow-sm">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {FieldIcon && <FieldIcon className="text-muted-foreground size-4" />}
          <span className="text-sm font-semibold">
            {t(`fieldNames.${def?.labelKey ?? field.type}`)}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">{field.id.slice(0, 8)}</p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="general" className="p-4">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1 text-xs">
              {t('tabs.general')}
            </TabsTrigger>
            {hasOptions && (
              <TabsTrigger value="options" className="flex-1 text-xs">
                {t('tabs.options')}
              </TabsTrigger>
            )}
            {isHidden ? (
              <TabsTrigger value="hidden" className="flex-1 text-xs">
                {t('tabs.hidden')}
              </TabsTrigger>
            ) : (
              <TabsTrigger value="validation" className="flex-1 text-xs">
                {t('tabs.validation')}
              </TabsTrigger>
            )}
            {!isHidden && (
              <TabsTrigger value="logic" className="flex-1 text-xs">
                {t('tabs.logic')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <FieldSettingsGeneral
              field={field}
              stepId={stepId}
              onUpdate={handleUpdate}
            />
          </TabsContent>

          {hasOptions && (
            <TabsContent value="options" className="mt-4">
              <FieldSettingsOptions field={field} onUpdate={handleUpdate} />
            </TabsContent>
          )}

          {isHidden ? (
            <TabsContent value="hidden" className="mt-4">
              <FieldSettingsHidden field={field} onUpdate={handleUpdate} />
            </TabsContent>
          ) : (
            <TabsContent value="validation" className="mt-4">
              <FieldSettingsValidation field={field} onUpdate={handleUpdate} />
            </TabsContent>
          )}

          {!isHidden && (
            <TabsContent value="logic" className="mt-4">
              <FieldSettingsLogic
                field={field}
                allFields={allFields}
                onUpdate={handleUpdate}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
