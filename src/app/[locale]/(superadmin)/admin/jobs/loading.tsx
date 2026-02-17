import { SkeletonStats } from '@/components/ui/skeletons/skeleton-stats'
import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function JobsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-56 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonStats count={4} />
      <SkeletonTable columns={5} rows={6} />
    </div>
  )
}
