'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import { setSetting, type PlatformSettings } from '@/lib/settings/platform'

export async function updatePlatformSettings(
  section: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const allowedKeys: (keyof PlatformSettings)[] = [
      'platform.name',
      'platform.default_locale',
      'platform.default_product_id',
      'invitation.expiry_days',
      'invitation.max_resends',
      'org.reserved_slugs',
      'analysis.max_transcript_size_mb',
    ]

    const changedKeys: string[] = []

    for (const [key, value] of Object.entries(data)) {
      if (!allowedKeys.includes(key as keyof PlatformSettings)) continue
      await setSetting(
        key as keyof PlatformSettings,
        value as PlatformSettings[keyof PlatformSettings],
        currentUser.id
      )
      changedKeys.push(key)
    }

    if (changedKeys.length > 0) {
      await logAudit({
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        action: 'settings.updated',
        entityType: 'platform_settings',
        metadata: { section, changedKeys },
      })
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to save settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}
