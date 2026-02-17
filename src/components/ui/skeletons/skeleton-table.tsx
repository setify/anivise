import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonTableProps {
  columns?: number
  rows?: number
  showHeader?: boolean
  showActions?: boolean
}

export function SkeletonTable({
  columns = 5,
  rows = 5,
  showHeader = true,
  showActions = true,
}: SkeletonTableProps) {
  const totalCols = showActions ? columns + 1 : columns

  return (
    <div className="w-full rounded-lg border">
      {showHeader && (
        <div className="flex items-center gap-4 border-b px-4 py-3">
          {Array.from({ length: totalCols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 skeleton-shimmer" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 flex-1 skeleton-shimmer"
              style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
            />
          ))}
          {showActions && (
            <Skeleton className="h-8 w-8 shrink-0 rounded skeleton-shimmer" />
          )}
        </div>
      ))}
    </div>
  )
}
