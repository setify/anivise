'use client'

import { AlertTriangle, Infinity } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
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
  const displayLimit = formatValue && limit !== null ? formatValue(limit) : limit !== null ? String(limit) : null

  const progressClass = cn(
    '[&>div]:transition-all',
    isDanger && '[&>div]:bg-destructive',
    isWarning && '[&>div]:bg-orange-500',
    !isDanger && !isWarning && '[&>div]:bg-green-500'
  )

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
        <Progress value={percentage} className={progressClass} />
      )}
    </div>
  )
}
