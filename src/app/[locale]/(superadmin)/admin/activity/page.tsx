import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAuditLogs } from '../actions'
import { ActivityPageClient } from './activity-page-client'

export default async function ActivityPage() {
  await requirePlatformRole('staff')
  const { logs, total } = await getAuditLogs({ limit: 50, offset: 0 })

  return <ActivityPageClient initialLogs={logs} initialTotal={total} />
}
