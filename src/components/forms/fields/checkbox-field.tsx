'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface CheckboxFieldProps {
  field: FormField
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
}

export function CheckboxField({ field, value, onChange, error, disabled }: CheckboxFieldProps) {
  const config = field.config.type === 'checkbox' ? field.config : null
  const options = config?.options ?? []
  const isButtons = field.displayVariant === 'buttons'
  const [otherValue, setOtherValue] = useState('')
  const knownValues = new Set(options.map((o) => o.value))
  const otherSelected = config?.allowOther && value.some((v) => !knownValues.has(v))

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  if (isButtons) {
    return (
      <FieldWrapper
        label={field.label}
        description={field.description}
        required={field.required}
        error={error}
      >
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = value.includes(option.value)
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(option.value)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent border-input'
                )}
              >
                {selected && <Check className="size-3.5" />}
                {option.label}
              </button>
            )
          })}
          {config?.allowOther && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (otherSelected) {
                  onChange(value.filter((v) => knownValues.has(v)))
                } else {
                  onChange([...value, otherValue || '__other__'])
                }
              }}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                otherSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-input'
              )}
            >
              {otherSelected && <Check className="size-3.5" />}
              Other
            </button>
          )}
        </div>
        {otherSelected && (
          <Input
            className="mt-2"
            value={otherValue}
            onChange={(e) => {
              const newOtherVal = e.target.value
              setOtherValue(newOtherVal)
              const filtered = value.filter((v) => knownValues.has(v))
              if (newOtherVal) filtered.push(newOtherVal)
              onChange(filtered)
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
        {options.map((option) => {
          const selected = value.includes(option.value)
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                selected
                  ? 'bg-primary/5 border-primary'
                  : 'hover:bg-accent border-input',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(option.value)}
                disabled={disabled}
                className="accent-primary size-4"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          )
        })}
        {config?.allowOther && (
          <>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                otherSelected
                  ? 'bg-primary/5 border-primary'
                  : 'hover:bg-accent border-input',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={otherSelected}
                onChange={() => {
                  if (otherSelected) {
                    onChange(value.filter((v) => knownValues.has(v)))
                  } else {
                    onChange([...value, otherValue || '__other__'])
                  }
                }}
                disabled={disabled}
                className="accent-primary size-4"
              />
              <span className="text-sm">Other</span>
            </label>
            {otherSelected && (
              <Input
                className="ml-7"
                value={otherValue}
                onChange={(e) => {
                  const newOtherVal = e.target.value
                  setOtherValue(newOtherVal)
                  const filtered = value.filter((v) => knownValues.has(v))
                  if (newOtherVal) filtered.push(newOtherVal)
                  onChange(filtered)
                }}
                placeholder="..."
                disabled={disabled}
              />
            )}
          </>
        )}
      </div>
    </FieldWrapper>
  )
}
