'use server'

import { db } from '@/lib/db'
import { organizationMembers, organizationNotificationSettings, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { OrganizationNotificationSettings } from '@/types/database'
import { getNotificationSettings } from '@/lib/notifications/should-notify'
import type { NotificationSettingKey } from '@/lib/notifications/should-notify'

async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (!membership || membership.role !== 'org_admin') throw new Error('Unauthorized')

  return { userId: user.id, email: user.email ?? '', organizationId: membership.organizationId }
}

export interface NotificationSettingsData {
  settings: OrganizationNotificationSettings & { isDefault: boolean }
  updatedByName: string | null
}

export async function getOrgNotificationSettings(): Promise<NotificationSettingsData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (!membership || membership.role !== 'org_admin') return null

  const settings = await getNotificationSettings(membership.organizationId)

  let updatedByName: string | null = null
  if (settings.updatedBy) {
    const [actor] = await db
      .select({ displayName: users.displayName, email: users.email })
      .from(users)
      .where(eq(users.id, settings.updatedBy))
      .limit(1)
    updatedByName = actor?.displayName ?? actor?.email ?? null
  }

  return { settings, updatedByName }
}

const BOOLEAN_KEYS: NotificationSettingKey[] = [
  'notifyLimitWarning80', 'notifyLimitReached100',
  'notifyAnalysisCompleted', 'notifyAnalysisFailed',
  'notifyMemberJoined', 'notifyMemberLeft', 'notifyInvitationExpired',
  'notifyFormSubmission', 'notifyFormAssigned',
  'notifyPlanChanged', 'notifyMaintenance',
]

export async function saveOrgNotificationSettings(
  values: Record<NotificationSettingKey, boolean>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, organizationId } = await requireOrgAdmin()

    const existing = await db
      .select({ id: organizationNotificationSettings.id })
      .from(organizationNotificationSettings)
      .where(eq(organizationNotificationSettings.organizationId, organizationId))
      .limit(1)

    const payload = {
      ...values,
      updatedBy: userId,
      updatedAt: new Date(),
    }

    if (existing.length > 0) {
      await db
        .update(organizationNotificationSettings)
        .set(payload)
        .where(eq(organizationNotificationSettings.organizationId, organizationId))
    } else {
      await db
        .insert(organizationNotificationSettings)
        .values({ organizationId, ...payload })
    }

    revalidatePath('/settings/notifications')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
