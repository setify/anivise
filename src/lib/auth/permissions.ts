import { hasRole, type Role } from './roles'

/** Can manage organization settings and users (org_admin+) */
export function canManageOrganization(role: Role): boolean {
  return hasRole(role, 'org_admin')
}

/** Can request a new analysis (manager+) */
export function canRequestAnalysis(role: Role): boolean {
  return hasRole(role, 'manager')
}

/** Can view a report. Members can only view their own reports. */
export function canViewReport(role: Role, isOwnReport: boolean): boolean {
  if (hasRole(role, 'manager')) return true
  return isOwnReport
}

/** Can manage team members (manager+) */
export function canManageTeam(role: Role): boolean {
  return hasRole(role, 'manager')
}

/** Can access the superadmin panel */
export function canAccessSuperadmin(isSuperadmin: boolean): boolean {
  return isSuperadmin
}

/** Permissions map per role for client-side UX checks */
export const ROLE_PERMISSIONS = {
  superadmin: {
    manageOrganization: true,
    requestAnalysis: true,
    viewAllReports: true,
    manageTeam: true,
    accessSuperadmin: true,
  },
  org_admin: {
    manageOrganization: true,
    requestAnalysis: true,
    viewAllReports: true,
    manageTeam: true,
    accessSuperadmin: false,
  },
  manager: {
    manageOrganization: false,
    requestAnalysis: true,
    viewAllReports: true,
    manageTeam: true,
    accessSuperadmin: false,
  },
  member: {
    manageOrganization: false,
    requestAnalysis: false,
    viewAllReports: false,
    manageTeam: false,
    accessSuperadmin: false,
  },
} as const satisfies Record<Role, Record<string, boolean>>
