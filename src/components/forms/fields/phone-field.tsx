'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface PhoneFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function PhoneField({ field, value, onChange, error, disabled }: PhoneFieldProps) {
  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <Input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    </FieldWrapper>
  )
}
