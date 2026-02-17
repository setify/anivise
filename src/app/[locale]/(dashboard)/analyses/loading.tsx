import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function AnalysesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-36 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-56 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
        </div>
      </div>
      <SkeletonTable columns={4} rows={5} />
    </div>
  )
}
