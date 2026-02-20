import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAnalysisJobDetail } from '../../actions'
import { JobDetailClient } from './job-detail-client'
import { notFound } from 'next/navigation'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformRole('staff')
  const { id } = await params
  const job = await getAnalysisJobDetail(id)

  if (!job) {
    notFound()
  }

  return <JobDetailClient job={job} />
}
