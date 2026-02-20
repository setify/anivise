import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAllPlatformUsers } from '../actions'
import { UsersPageClient } from './users-page-client'

export default async function UsersPage() {
  await requirePlatformRole('staff')
  const users = await getAllPlatformUsers()

  return <UsersPageClient initialUsers={users} />
}
