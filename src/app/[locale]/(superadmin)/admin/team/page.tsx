import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getTeamMembers, getPendingInvitations } from '../actions'
import { TeamPageClient } from './team-page-client'

export default async function TeamPage() {
  const currentUser = await requirePlatformRole('staff')
  const [members, invitations] = await Promise.all([
    getTeamMembers(),
    getPendingInvitations(),
  ])

  return (
    <TeamPageClient
      currentUser={currentUser}
      members={members}
      invitations={invitations}
    />
  )
}
