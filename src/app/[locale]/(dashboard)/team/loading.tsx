import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-24 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-48 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
        </div>
      </div>
      <SkeletonTable columns={3} rows={4} />
    </div>
  )
}
