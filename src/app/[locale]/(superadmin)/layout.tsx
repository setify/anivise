import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getSetting } from '@/lib/settings/platform'
import { AdminLayoutClient } from './admin-layout-client'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePlatformRole('staff')
  const logoUrl = await getSetting('platform.logo_url')

  return (
    <AdminLayoutClient
      platformRole={user.platformRole}
      logoUrl={logoUrl || undefined}
      user={{
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        platformRole: user.platformRole,
      }}
    >
      {children}
    </AdminLayoutClient>
  )
}
