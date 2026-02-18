import { getOrgUsers, getOrgUserStats, getOrgInvitations, getOrgDepartments, getOrgLocations, getOrgSeats } from './actions'
import { UsersPageClient } from './users-page-client'

export default async function UsersPage() {
  const [members, stats, invitations, departments, locations, seats] = await Promise.all([
    getOrgUsers(),
    getOrgUserStats(),
    getOrgInvitations(),
    getOrgDepartments(),
    getOrgLocations(),
    getOrgSeats(),
  ])

  return (
    <UsersPageClient
      members={members}
      stats={stats}
      invitations={invitations}
      departments={departments}
      locations={locations}
      seats={seats}
    />
  )
}
