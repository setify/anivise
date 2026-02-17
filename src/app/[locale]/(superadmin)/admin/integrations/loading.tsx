import { SkeletonCard } from '@/components/ui/skeletons/skeleton-card'

export default function IntegrationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-40 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-72 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  )
}
