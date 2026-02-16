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
