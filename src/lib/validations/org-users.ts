import { z } from 'zod/v4'

// --- User Invitation & Creation ---

export const inviteOrgUserSchema = z.object({
  email: z.email(),
  targetOrgRole: z.enum(['org_admin', 'manager']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  position: z.string().max(200).optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
})

export type InviteOrgUserInput = z.infer<typeof inviteOrgUserSchema>

export const createDirectOrgUserSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  targetOrgRole: z.enum(['org_admin', 'manager']),
  position: z.string().max(200).optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  phone: z.string().max(50).optional(),
  password: z.string().min(8),
})

export type CreateDirectOrgUserInput = z.infer<typeof createDirectOrgUserSchema>

// --- Member Management ---

export const updateOrgMemberSchema = z.object({
  memberId: z.string().uuid(),
  position: z.string().max(200).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  locationId: z.string().uuid().nullable().optional(),
  phone: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
})

export type UpdateOrgMemberInput = z.infer<typeof updateOrgMemberSchema>

export const changeOrgMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  newRole: z.enum(['org_admin', 'manager', 'member']),
})

export type ChangeOrgMemberRoleInput = z.infer<typeof changeOrgMemberRoleSchema>

export const deactivateOrgMemberSchema = z.object({
  memberId: z.string().uuid(),
})

export type DeactivateOrgMemberInput = z.infer<typeof deactivateOrgMemberSchema>

export const reactivateOrgMemberSchema = z.object({
  memberId: z.string().uuid(),
})

export type ReactivateOrgMemberInput = z.infer<typeof reactivateOrgMemberSchema>

export const removeOrgMemberSchema = z.object({
  memberId: z.string().uuid(),
  confirmName: z.string().min(1),
})

export type RemoveOrgMemberInput = z.infer<typeof removeOrgMemberSchema>

// --- Departments ---

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>

export const updateDepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>

export const deleteDepartmentSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteDepartmentInput = z.infer<typeof deleteDepartmentSchema>

// --- Locations ---

export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>

export const updateLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>

export const deleteLocationSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteLocationInput = z.infer<typeof deleteLocationSchema>

// --- Invitations ---

export const resendInvitationSchema = z.object({
  invitationId: z.string().uuid(),
})

export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
})

export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>
