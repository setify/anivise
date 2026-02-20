import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-32 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonTable columns={5} rows={6} />
    </div>
  )
}
