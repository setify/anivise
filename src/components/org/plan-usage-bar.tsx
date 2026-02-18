'use client'

import { AlertTriangle, Infinity } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PlanUsageBarProps {
  label: string
  current: number
  limit: number | null
  unit?: string
  formatValue?: (value: number) => string
}

export function PlanUsageBar({
  label,
  current,
  limit,
  unit,
  formatValue,
}: PlanUsageBarProps) {
  const isUnlimited = limit === null
  const percentage = isUnlimited
    ? 0
    : limit === 0
      ? 100
      : Math.min((current / limit) * 100, 100)

  const isWarning = !isUnlimited && percentage >= 60 && percentage < 85
  const isDanger = !isUnlimited && percentage >= 85

  const displayCurrent = formatValue ? formatValue(current) : String(current)
  const displayLimit =
    formatValue && limit !== null
      ? formatValue(limit)
      : limit !== null
        ? String(limit)
        : null

  const fillColor = isDanger
    ? 'var(--destructive)'
    : isWarning
      ? 'var(--attention)'
      : 'var(--success)'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          {isUnlimited ? (
            <>
              <Infinity className="size-3.5" />
              <span>Unbegrenzt</span>
            </>
          ) : (
            <>
              {displayCurrent} / {displayLimit}
              {unit && <span className="ml-1">{unit}</span>}
              {isDanger && (
                <AlertTriangle className="ml-1 size-3.5 text-destructive" />
              )}
            </>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: fillColor }}
          />
        </div>
      )}
    </div>
  )
}
