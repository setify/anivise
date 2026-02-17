import { SkeletonCard } from '@/components/ui/skeletons/skeleton-card'

export default function FormsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} compact lines={2} />
        ))}
      </div>
    </div>
  )
}
