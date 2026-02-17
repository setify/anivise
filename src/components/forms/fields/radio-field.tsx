'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface RadioFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function RadioField({ field, value, onChange, error, disabled }: RadioFieldProps) {
  const config = field.config.type === 'radio' ? field.config : null
  const options = config?.options ?? []
  const isButtons = field.displayVariant === 'buttons'
  const [otherValue, setOtherValue] = useState('')
  const isOtherSelected = config?.allowOther && value !== '' && !options.some((o) => o.value === value)

  if (isButtons) {
    return (
      <FieldWrapper
        label={field.label}
        description={field.description}
        required={field.required}
        error={error}
      >
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                value === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-input'
              )}
            >
              {option.label}
            </button>
          ))}
          {config?.allowOther && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(otherValue || '__other__')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                isOtherSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-input'
              )}
            >
              Other
            </button>
          )}
        </div>
        {isOtherSelected && (
          <Input
            className="mt-2"
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value)
              onChange(e.target.value)
            }}
            placeholder="..."
            disabled={disabled}
          />
        )}
      </FieldWrapper>
    )
  }

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
              value === option.value
                ? 'bg-primary/5 border-primary'
                : 'hover:bg-accent border-input',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="accent-primary size-4"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
        {config?.allowOther && (
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
              isOtherSelected
                ? 'bg-primary/5 border-primary'
                : 'hover:bg-accent border-input',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={field.id}
              checked={isOtherSelected}
              onChange={() => onChange(otherValue || '__other__')}
              disabled={disabled}
              className="accent-primary size-4"
            />
            <span className="text-sm">Other</span>
          </label>
        )}
        {isOtherSelected && (
          <Input
            className="ml-7"
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value)
              onChange(e.target.value)
            }}
            placeholder="..."
            disabled={disabled}
          />
        )}
      </div>
    </FieldWrapper>
  )
}
