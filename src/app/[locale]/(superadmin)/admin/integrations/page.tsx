import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { redirect } from 'next/navigation'
import { getVercelInfo } from './actions'
import { IntegrationsPageClient } from './integrations-page-client'

export default async function IntegrationsPage() {
  const user = await requirePlatformRole('superadmin')
  if (!user) redirect('/admin')

  const vercelInfo = await getVercelInfo()

  return <IntegrationsPageClient vercelInfo={vercelInfo} />
}
