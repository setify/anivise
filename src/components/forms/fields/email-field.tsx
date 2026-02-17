'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface EmailFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function EmailField({ field, value, onChange, error, disabled }: EmailFieldProps) {
  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    </FieldWrapper>
  )
}
