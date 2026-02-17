import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonCardProps {
  showTitle?: boolean
  showDescription?: boolean
  lines?: number
  compact?: boolean
}

export function SkeletonCard({
  showTitle = true,
  showDescription = true,
  lines = 3,
  compact = false,
}: SkeletonCardProps) {
  return (
    <div className="rounded-lg border p-6">
      {showTitle && <Skeleton className={`${compact ? 'h-4 w-1/3' : 'h-5 w-2/5'} skeleton-shimmer`} />}
      {showDescription && (
        <Skeleton className="mt-2 h-3 w-3/5 skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      )}
      <div className={`${showTitle || showDescription ? 'mt-4' : ''} space-y-3`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton
              className="h-4 flex-1 skeleton-shimmer"
              style={{ animationDelay: `${(i + 2) * 50}ms` }}
            />
            <Skeleton
              className="h-4 w-1/4 skeleton-shimmer"
              style={{ animationDelay: `${(i + 2) * 50 + 25}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
