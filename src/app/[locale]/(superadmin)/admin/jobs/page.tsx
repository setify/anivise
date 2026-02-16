import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAnalysisJobs, getAnalysisJobStats, getOrganizations } from '../actions'
import { JobsPageClient } from './jobs-page-client'

export default async function JobsPage() {
  await requirePlatformRole('staff')

  const [{ jobs, total }, stats, orgs] = await Promise.all([
    getAnalysisJobs({ limit: 50, offset: 0 }),
    getAnalysisJobStats(),
    getOrganizations(),
  ])

  return (
    <JobsPageClient
      initialJobs={jobs}
      initialTotal={total}
      stats={stats}
      organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
    />
  )
}
