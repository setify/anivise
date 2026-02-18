import { SkeletonForm } from '@/components/ui/skeletons/skeleton-form'

export default function PlanLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-40 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonForm fields={4} />
    </div>
  )
}
