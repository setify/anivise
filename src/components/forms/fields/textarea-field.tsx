'use client'

import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface TextareaFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function TextareaField({ field, value, onChange, error, disabled }: TextareaFieldProps) {
  const rows = field.config.type === 'textarea' ? (field.config.rows ?? 4) : 4

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={
          field.config.type === 'textarea' ? field.config.maxLength : undefined
        }
      />
    </FieldWrapper>
  )
}
