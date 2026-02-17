'use client'

import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FormField, FieldCondition, ConditionalLogic, ConditionOperator } from '@/types/form-schema'

interface FieldSettingsLogicProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (updates: Partial<FormField>) => void
}

const OPERATORS: ConditionOperator[] = [
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
]

export function FieldSettingsLogic({ field, allFields, onUpdate }: FieldSettingsLogicProps) {
  const t = useTranslations('admin.forms.builder.settings')

  const otherFields = allFields.filter((f) => f.id !== field.id)
  const logic = field.conditionalLogic
  const enabled = !!logic

  const toggleLogic = (checked: boolean) => {
    if (checked) {
      onUpdate({
        conditionalLogic: {
          action: 'show',
          logicType: 'all',
          conditions: [{ fieldId: '', operator: 'equals', value: '' }],
        },
      })
    } else {
      onUpdate({ conditionalLogic: undefined })
    }
  }

  const updateLogic = (updates: Partial<ConditionalLogic>) => {
    if (!logic) return
    onUpdate({ conditionalLogic: { ...logic, ...updates } })
  }

  const updateCondition = (index: number, updates: Partial<FieldCondition>) => {
    if (!logic) return
    const conditions = [...logic.conditions]
    conditions[index] = { ...conditions[index], ...updates }
    updateLogic({ conditions })
  }

  const addCondition = () => {
    if (!logic) return
    updateLogic({
      conditions: [
        ...logic.conditions,
        { fieldId: '', operator: 'equals', value: '' },
      ],
    })
  }

  const removeCondition = (index: number) => {
    if (!logic || logic.conditions.length <= 1) return
    updateLogic({
      conditions: logic.conditions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="conditional-logic" className="cursor-pointer">
          {t('conditionalDisplay')}
        </Label>
        <Switch
          id="conditional-logic"
          checked={enabled}
          onCheckedChange={toggleLogic}
        />
      </div>

      {enabled && logic && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('action')}</Label>
              <Select
                value={logic.action}
                onValueChange={(v) => updateLogic({ action: v as 'show' | 'hide' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">{t('showWhen')}</SelectItem>
                  <SelectItem value="hide">{t('hideWhen')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('logicType')}</Label>
              <Select
                value={logic.logicType}
                onValueChange={(v) => updateLogic({ logicType: v as 'all' | 'any' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allConditions')}</SelectItem>
                  <SelectItem value="any">{t('anyCondition')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {logic.conditions.map((condition, index) => (
              <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-2">
                  <Select
                    value={condition.fieldId}
                    onValueChange={(v) => updateCondition(index, { fieldId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectField')} />
                    </SelectTrigger>
                    <SelectContent>
                      {otherFields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label || f.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(v) =>
                      updateCondition(index, { operator: v as ConditionOperator })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op} value={op}>
                          {t(`operators.${op}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                    <Input
                      value={String(condition.value)}
                      onChange={(e) =>
                        updateCondition(index, { value: e.target.value })
                      }
                      placeholder={t('conditionValue')}
                    />
                  )}
                </div>
                {logic.conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-1" onClick={addCondition}>
            <Plus className="size-3.5" />
            {t('addCondition')}
          </Button>
        </div>
      )}
    </div>
  )
}
