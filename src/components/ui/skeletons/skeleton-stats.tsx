import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonStatsProps {
  count?: number
}

export function SkeletonStats({ count = 4 }: SkeletonStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 skeleton-shimmer" style={{ animationDelay: `${i * 60}ms` }} />
            <Skeleton className="size-8 rounded skeleton-shimmer" style={{ animationDelay: `${i * 60 + 30}ms` }} />
          </div>
          <Skeleton className="h-7 w-16 skeleton-shimmer" style={{ animationDelay: `${i * 60 + 60}ms` }} />
          <Skeleton className="h-3 w-24 skeleton-shimmer" style={{ animationDelay: `${i * 60 + 90}ms` }} />
        </div>
      ))}
    </div>
  )
}
