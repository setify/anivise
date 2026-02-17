import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3 skeleton-shimmer" />
          <Skeleton className="h-3 w-1/5 skeleton-shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        <Skeleton className="h-9 w-24 rounded-md skeleton-shimmer" />
      </div>
      {/* Content blocks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-1/3 skeleton-shimmer" style={{ animationDelay: '100ms' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/4 skeleton-shimmer" style={{ animationDelay: `${150 + i * 50}ms` }} />
              <Skeleton className="h-4 w-1/3 skeleton-shimmer" style={{ animationDelay: `${175 + i * 50}ms` }} />
            </div>
          ))}
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-1/3 skeleton-shimmer" style={{ animationDelay: '150ms' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3 skeleton-shimmer" style={{ animationDelay: `${200 + i * 50}ms` }} />
              <Skeleton className="h-4 w-1/4 skeleton-shimmer" style={{ animationDelay: `${225 + i * 50}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
