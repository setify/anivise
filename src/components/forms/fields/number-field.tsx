'use client'

import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface NumberFieldProps {
  field: FormField
  value: number | ''
  onChange: (value: number | '') => void
  error?: string
  disabled?: boolean
}

export function NumberField({ field, value, onChange, error, disabled }: NumberFieldProps) {
  const config = field.config.type === 'number' ? field.config : null

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? '' : Number(v))
          }}
          placeholder={field.placeholder}
          disabled={disabled}
          min={config?.min}
          max={config?.max}
          step={config?.step}
        />
        {config?.unit && (
          <span className="text-muted-foreground text-sm">{config.unit}</span>
        )}
      </div>
    </FieldWrapper>
  )
}
