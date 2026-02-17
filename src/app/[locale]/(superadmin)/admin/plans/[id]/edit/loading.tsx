import { SkeletonForm } from '@/components/ui/skeletons/skeleton-form'

export default function PlanEditLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded bg-muted skeleton-shimmer" />
        <div className="flex-1 space-y-1">
          <div className="h-7 w-48 rounded bg-muted skeleton-shimmer" />
        </div>
      </div>
      <SkeletonForm fields={6} />
    </div>
  )
}
