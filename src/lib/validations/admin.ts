import { z } from 'zod/v4'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  timezone: z.string().max(100).optional(),
  preferredLocale: z.enum(['de', 'en']),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const inviteTeamMemberSchema = z.object({
  email: z.email(),
  role: z.enum(['superadmin', 'staff']),
})

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>

export const updateTeamMemberRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['superadmin', 'staff']),
})

export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>

export const removeTeamMemberSchema = z.object({
  userId: z.string().uuid(),
})

export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: 'Slug must be lowercase alphanumeric with hyphens only',
    }),
  subscriptionTier: z.enum(['individual', 'team', 'enterprise']),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const deleteOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
})

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>

export const updateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: 'Slug must be lowercase alphanumeric with hyphens only',
    }),
  subscriptionTier: z.enum(['individual', 'team', 'enterprise']),
  subscriptionStatus: z.enum(['trial', 'active', 'cancelled', 'expired']),
  defaultLocale: z.enum(['de', 'en']).nullable(),
  maxMembers: z.number().int().min(1).nullable(),
  maxAnalysesPerMonth: z.number().int().min(1).nullable(),
  internalNotes: z.string().max(5000).nullable(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
