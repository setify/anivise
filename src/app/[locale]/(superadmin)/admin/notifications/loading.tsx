import { SkeletonTable } from '@/components/ui/skeletons/skeleton-table'

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-48 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-56 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonTable columns={3} rows={6} showActions={false} />
    </div>
  )
}
