import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonFormProps {
  fields?: number
  showTitle?: boolean
}

export function SkeletonForm({ fields = 4, showTitle = true }: SkeletonFormProps) {
  return (
    <div className="rounded-lg border p-6">
      {showTitle && (
        <>
          <Skeleton className="h-5 w-1/3 skeleton-shimmer" />
          <Skeleton className="mt-2 h-3 w-2/3 skeleton-shimmer" style={{ animationDelay: '50ms' }} />
          <div className="my-6 border-t" />
        </>
      )}
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton
              className="h-3 w-24 skeleton-shimmer"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <Skeleton
              className="h-9 w-full rounded-md skeleton-shimmer"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
