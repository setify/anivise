import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const user = await requirePlatformRole('staff')

  return <ProfileForm user={user} />
}
