import { getUserProfile } from './actions'
import { ProfileClient } from './profile-client'

export default async function DashboardProfilePage() {
  const user = await getUserProfile()
  return <ProfileClient user={user} />
}
