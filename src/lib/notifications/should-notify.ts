import { db } from '@/lib/db'
import { organizationNotificationSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { OrganizationNotificationSettings } from '@/types/database'

/** Keys of boolean notification fields (excludes id, organizationId, updatedBy, dates) */
export type NotificationSettingKey = keyof Pick<
  OrganizationNotificationSettings,
  | 'notifyLimitWarning80'
  | 'notifyLimitReached100'
  | 'notifyAnalysisCompleted'
  | 'notifyAnalysisFailed'
  | 'notifyMemberJoined'
  | 'notifyMemberLeft'
  | 'notifyInvitationExpired'
  | 'notifyFormSubmission'
  | 'notifyFormAssigned'
  | 'notifyPlanChanged'
  | 'notifyMaintenance'
>

/** Default values used when no settings row exists yet for an org */
const NOTIFICATION_DEFAULTS: Record<NotificationSettingKey, boolean> = {
  notifyLimitWarning80: true,
  notifyLimitReached100: true,
  notifyAnalysisCompleted: true,
  notifyAnalysisFailed: true,
  notifyMemberJoined: true,
  notifyMemberLeft: false,
  notifyInvitationExpired: false,
  notifyFormSubmission: false,
  notifyFormAssigned: true,
  notifyPlanChanged: true,
  notifyMaintenance: true,
}

/**
 * Check whether a notification of a given type should be sent for an organization.
 * Falls back to defaults if no settings row exists yet.
 */
export async function shouldNotifyOrg(
  orgId: string,
  notificationType: NotificationSettingKey
): Promise<boolean> {
  const [settings] = await db
    .select()
    .from(organizationNotificationSettings)
    .where(eq(organizationNotificationSettings.organizationId, orgId))
    .limit(1)

  if (!settings) {
    return NOTIFICATION_DEFAULTS[notificationType]
  }

  return settings[notificationType] ?? NOTIFICATION_DEFAULTS[notificationType]
}

/** Load notification settings for an org (with defaults if no row exists). */
export async function getNotificationSettings(
  orgId: string
): Promise<OrganizationNotificationSettings & { isDefault: boolean }> {
  const [settings] = await db
    .select()
    .from(organizationNotificationSettings)
    .where(eq(organizationNotificationSettings.organizationId, orgId))
    .limit(1)

  if (!settings) {
    // Return default shape with sentinel values
    return {
      id: '',
      organizationId: orgId,
      ...NOTIFICATION_DEFAULTS,
      updatedBy: null,
      updatedAt: null,
      createdAt: new Date(),
      isDefault: true,
    }
  }

  return { ...settings, isDefault: false }
}
