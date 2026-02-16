import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAllSettings } from '@/lib/settings/platform'
import { SettingsPageClient } from './settings-page-client'

export default async function SettingsPage() {
  const currentUser = await requirePlatformRole('superadmin')
  const settings = await getAllSettings()

  return <SettingsPageClient settings={settings} currentUser={currentUser} />
}
