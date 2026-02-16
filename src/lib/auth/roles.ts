/**
 * RBAC Role definitions and hierarchy helpers.
 *
 * Roles:
 * - superadmin: Platform-wide access (flag on users table, not org-scoped)
 * - org_admin:  Organization-level admin
 * - manager:    Team/department level
 * - member:     Self-only access
 */

export const ROLES = ['superadmin', 'org_admin', 'manager', 'member'] as const

export type Role = (typeof ROLES)[number]

/** Org-scoped roles (stored in organization_members table) */
export type OrgRole = Exclude<Role, 'superadmin'>

const ROLE_LEVELS: Record<Role, number> = {
  superadmin: 100,
  org_admin: 75,
  manager: 50,
  member: 25,
}

/** Get numeric level for a role (higher = more privileges) */
export function getRoleLevel(role: Role): number {
  return ROLE_LEVELS[role]
}

/** Check if userRole meets or exceeds the requiredRole in the hierarchy */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/** Check if a value is a valid Role */
export function isValidRole(value: string): value is Role {
  return ROLES.includes(value as Role)
}

/** Check if a value is a valid OrgRole */
export function isValidOrgRole(value: string): value is OrgRole {
  return value === 'org_admin' || value === 'manager' || value === 'member'
}
