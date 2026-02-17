'use client'

import type { FormField } from '@/types/form-schema'

interface HiddenFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
}

export function HiddenField({ field, value, onChange }: HiddenFieldProps) {
  return (
    <input type="hidden" name={field.id} value={value} onChange={(e) => onChange(e.target.value)} />
  )
}
