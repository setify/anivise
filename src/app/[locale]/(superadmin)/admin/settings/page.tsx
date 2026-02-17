import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAllSettings } from '@/lib/settings/platform'
import { getActiveProducts } from '../actions'
import { SettingsPageClient } from './settings-page-client'

export default async function SettingsPage() {
  const currentUser = await requirePlatformRole('superadmin')
  const [settings, activeProducts] = await Promise.all([
    getAllSettings(),
    getActiveProducts(),
  ])

  return (
    <SettingsPageClient
      settings={settings}
      currentUser={currentUser}
      activeProducts={activeProducts}
    />
  )
}
