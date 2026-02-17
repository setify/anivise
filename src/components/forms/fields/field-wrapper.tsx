'use client'

import { cn } from '@/lib/utils'

interface FieldWrapperProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  hidden?: boolean
  children: React.ReactNode
}

export function FieldWrapper({
  label,
  description,
  required,
  error,
  hidden,
  children,
}: FieldWrapperProps) {
  if (hidden) return null

  return (
    <div
      className={cn(
        'space-y-2 transition-all duration-300',
        error && 'animate-in fade-in'
      )}
    >
      <div>
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </div>

      {children}

      {error && (
        <p className="text-destructive animate-in fade-in slide-in-from-top-1 text-xs duration-200">
          {error}
        </p>
      )}
    </div>
  )
}
