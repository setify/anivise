'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface CsatFieldProps {
  field: FormField
  value: number | null
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
}

const CSAT_COLORS = [
  'bg-red-500',        // 1
  'bg-red-400',        // 2
  'bg-orange-500',     // 3
  'bg-orange-400',     // 4
  'bg-yellow-500',     // 5
  'bg-yellow-400',     // 6
  'bg-lime-500',       // 7
  'bg-lime-400',       // 8
  'bg-green-500',      // 9
  'bg-green-400',      // 10
]

export function CsatField({ field, value, onChange, error, disabled }: CsatFieldProps) {
  const config = field.config.type === 'csat' ? field.config : null
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1">
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1
            const isSelected = value === n
            const isHovered = hoveredValue === n

            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onChange(n)}
                onMouseEnter={() => setHoveredValue(n)}
                onMouseLeave={() => setHoveredValue(null)}
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200',
                  isSelected
                    ? `${CSAT_COLORS[i]} border-transparent text-white`
                    : isHovered
                      ? 'bg-accent scale-110 border-current'
                      : 'bg-background hover:bg-accent border-input',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{config?.minLabel ?? ''}</span>
          <span>{config?.maxLabel ?? ''}</span>
        </div>
      </div>
    </FieldWrapper>
  )
}
