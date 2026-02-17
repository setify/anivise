'use client'

import { useState } from 'react'
import { Star, Heart, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from './field-wrapper'
import type { FormField } from '@/types/form-schema'

interface RatingFieldProps {
  field: FormField
  value: number | null
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
}

export function RatingField({ field, value, onChange, error, disabled }: RatingFieldProps) {
  const config = field.config.type === 'rating' ? field.config : null
  const icon = config?.icon ?? 'star'
  const maxStars = config?.maxStars ?? 5
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  const IconComponent = icon === 'heart' ? Heart : icon === 'thumb' ? ThumbsUp : Star
  const activeDisplay = hoveredValue ?? value ?? 0

  return (
    <FieldWrapper
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <div className="flex gap-1">
        {Array.from({ length: maxStars }, (_, i) => {
          const n = i + 1
          const isFilled = n <= activeDisplay

          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHoveredValue(n)}
              onMouseLeave={() => setHoveredValue(null)}
              className={cn(
                'transition-all duration-150',
                isFilled
                  ? icon === 'heart'
                    ? 'text-rose-500'
                    : icon === 'thumb'
                      ? 'text-blue-500'
                      : 'text-amber-400'
                  : 'text-muted-foreground/40',
                !disabled && 'hover:scale-125',
                value === n && 'animate-in zoom-in duration-200',
                disabled && 'cursor-not-allowed'
              )}
            >
              <IconComponent
                className="size-8"
                fill={isFilled ? 'currentColor' : 'none'}
              />
            </button>
          )
        })}
      </div>
    </FieldWrapper>
  )
}
