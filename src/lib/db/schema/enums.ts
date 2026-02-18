import { pgEnum } from 'drizzle-orm/pg-core'

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'individual',
  'team',
  'enterprise',
])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'cancelled',
  'expired',
])

export const orgMemberRoleEnum = pgEnum('org_member_role', [
  'org_admin',
  'manager',
  'member',
])

export const consentTypeEnum = pgEnum('consent_type', [
  'analysis',
  'data_retention',
  'sharing',
])

export const consentStatusEnum = pgEnum('consent_status', [
  'active',
  'revoked',
])

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
])

export const localeEnum = pgEnum('locale', ['de', 'en'])

export const platformRoleEnum = pgEnum('platform_role', [
  'superadmin',
  'staff',
])

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled',
])

export const invitationTypeEnum = pgEnum('invitation_type', [
  'platform',
  'organization',
])

export const formStatusEnum = pgEnum('form_status', [
  'draft',
  'published',
  'archived',
])

export const formVisibilityEnum = pgEnum('form_visibility', [
  'all_organizations',
  'assigned',
])

export const formCompletionTypeEnum = pgEnum('form_completion_type', [
  'thank_you',
  'redirect',
])

export const formStepDisplayModeEnum = pgEnum('form_step_display_mode', [
  'progress_bar',
  'tabs',
])

export const productStatusEnum = pgEnum('product_status', [
  'active',
  'archived',
])

export const employeeStatusEnum = pgEnum('employee_status', [
  'active',
  'inactive',
  'archived',
])

export const analysisStatusEnum = pgEnum('analysis_status', [
  'planned',
  'active',
  'completed',
])

export const mediaContextEnum = pgEnum('media_context', [
  'email_logo',
  'email_template',
  'form_header',
  'guide',
  'org_logo',
  'report_asset',
  'user_avatar',
  'employee_avatar',
  'general',
])
