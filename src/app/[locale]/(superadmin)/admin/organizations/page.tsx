import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getOrganizations } from '../actions'
import { OrganizationsPageClient } from './orgs-page-client'

export default async function OrganizationsPage() {
  const currentUser = await requirePlatformRole('staff')
  const orgs = await getOrganizations()

  return (
    <OrganizationsPageClient
      organizations={orgs}
      isSuperadmin={currentUser.platformRole === 'superadmin'}
    />
  )
}
