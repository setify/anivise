import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { redirect } from 'next/navigation'
import { getActivityLog } from './actions'
import { ActivityLogClient } from './activity-log-client'

export default async function ActivityLogPage() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) redirect('/settings')

  const { logs, total } = await getActivityLog({ limit: 50 })

  return <ActivityLogClient initialLogs={logs} initialTotal={total} />
}
