import { SkeletonForm } from '@/components/ui/skeletons/skeleton-form'

export default function OrgEditLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded bg-muted skeleton-shimmer" />
        <div className="flex-1 space-y-1">
          <div className="h-7 w-48 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        <div className="h-9 w-28 rounded-md bg-muted skeleton-shimmer" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonForm fields={2} />
        <SkeletonForm fields={2} />
        <SkeletonForm fields={1} />
        <SkeletonForm fields={1} showTitle={false} />
      </div>
    </div>
  )
}
