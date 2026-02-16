/**
 * RBAC Role definitions and hierarchy helpers.
 *
 * Platform roles (stored on users table):
 * - superadmin: Full platform access, can manage staff and all orgs
 * - staff: Limited platform access, can view/manage assigned orgs
 *
 * Org-scoped roles (stored in organization_members table):
 * - org_admin:  Organization-level admin
 * - manager:    Team/department level
 * - member:     Self-only access
 */

export const ROLES = ['superadmin', 'org_admin', 'manager', 'member'] as const

export type Role = (typeof ROLES)[number]

/** Org-scoped roles (stored in organization_members table) */
export type OrgRole = Exclude<Role, 'superadmin'>

/** Platform-level roles (stored on users.platform_role) */
export const PLATFORM_ROLES = ['superadmin', 'staff'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

const ROLE_LEVELS: Record<Role, number> = {
  superadmin: 100,
  org_admin: 75,
  manager: 50,
  member: 25,
}

const PLATFORM_ROLE_LEVELS: Record<PlatformRole, number> = {
  superadmin: 100,
  staff: 50,
}

/** Get numeric level for a role (higher = more privileges) */
export function getRoleLevel(role: Role): number {
  return ROLE_LEVELS[role]
}

/** Get numeric level for a platform role */
export function getPlatformRoleLevel(role: PlatformRole): number {
  return PLATFORM_ROLE_LEVELS[role]
}

/** Check if userRole meets or exceeds the requiredRole in the hierarchy */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/** Check if the user's platform role meets or exceeds the required platform role */
export function hasPlatformRole(
  userRole: PlatformRole | null,
  requiredRole: PlatformRole
): boolean {
  if (!userRole) return false
  return getPlatformRoleLevel(userRole) >= getPlatformRoleLevel(requiredRole)
}

/** Check if a value is a valid Role */
export function isValidRole(value: string): value is Role {
  return ROLES.includes(value as Role)
}

/** Check if a value is a valid OrgRole */
export function isValidOrgRole(value: string): value is OrgRole {
  return value === 'org_admin' || value === 'manager' || value === 'member'
}

/** Check if a value is a valid PlatformRole */
export function isValidPlatformRole(value: string): value is PlatformRole {
  return PLATFORM_ROLES.includes(value as PlatformRole)
}
