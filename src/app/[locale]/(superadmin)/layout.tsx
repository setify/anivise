import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { AdminLayoutClient } from './admin-layout-client'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePlatformRole('staff')

  return (
    <AdminLayoutClient platformRole={user.platformRole}>
      {children}
    </AdminLayoutClient>
  )
}
