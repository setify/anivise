import { SkeletonStats } from '@/components/ui/skeletons/skeleton-stats'
import { SkeletonCard } from '@/components/ui/skeletons/skeleton-card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-48 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonStats count={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  )
}
