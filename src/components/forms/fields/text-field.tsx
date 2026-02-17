'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface TextFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function TextField({ field, value, onChange, error, disabled }: TextFieldProps) {
  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        maxLength={
          field.config.type === 'text' ? field.config.maxLength : undefined
        }
      />
    </FieldWrapper>
  )
}
