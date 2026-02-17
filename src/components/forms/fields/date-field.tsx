'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface DateFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function DateField({ field, value, onChange, error, disabled }: DateFieldProps) {
  const config = field.config.type === 'date' ? field.config : null

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <Input
        type={config?.includeTime ? 'datetime-local' : 'date'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={config?.minDate}
        max={config?.maxDate}
      />
    </FieldWrapper>
  )
}
