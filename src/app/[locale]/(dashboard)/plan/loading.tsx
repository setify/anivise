import { SkeletonCard } from '@/components/ui/skeletons/skeleton-card'

export default function PlanLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-24 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
    </div>
  )
}
