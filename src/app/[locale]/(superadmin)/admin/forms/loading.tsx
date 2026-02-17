import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function FormsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-36 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
        </div>
        <div className="h-9 w-40 rounded-md bg-muted skeleton-shimmer" />
      </div>
      <SkeletonTable columns={5} rows={5} />
    </div>
  )
}
