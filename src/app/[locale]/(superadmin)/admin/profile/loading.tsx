import { SkeletonForm } from '@/components/ui/skeletons/skeleton-form'

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-32 rounded bg-muted skeleton-shimmer" />
        <div className="h-4 w-48 rounded bg-muted skeleton-shimmer" style={{ animationDelay: '50ms' }} />
      </div>
      <SkeletonForm fields={6} />
    </div>
  )
}
