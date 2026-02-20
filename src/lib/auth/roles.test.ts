import { describe, it, expect } from 'vitest'
import {
  ROLES,
  PLATFORM_ROLES,
  getRoleLevel,
  getPlatformRoleLevel,
  hasRole,
  hasPlatformRole,
  isValidRole,
  isValidOrgRole,
  isValidPlatformRole,
} from './roles'
import type { Role, OrgRole, PlatformRole } from './roles'

describe('roles', () => {
  describe('ROLES constant', () => {
    it('should contain exactly 4 roles in hierarchy order', () => {
      expect(ROLES).toEqual(['superadmin', 'org_admin', 'manager', 'member'])
      expect(ROLES).toHaveLength(4)
    })
  })

  describe('PLATFORM_ROLES constant', () => {
    it('should contain superadmin and staff', () => {
      expect(PLATFORM_ROLES).toEqual(['superadmin', 'staff'])
      expect(PLATFORM_ROLES).toHaveLength(2)
    })
  })

  describe('getRoleLevel', () => {
    it('should return 100 for superadmin', () => {
      expect(getRoleLevel('superadmin')).toBe(100)
    })

    it('should return 75 for org_admin', () => {
      expect(getRoleLevel('org_admin')).toBe(75)
    })

    it('should return 50 for manager', () => {
      expect(getRoleLevel('manager')).toBe(50)
    })

    it('should return 25 for member', () => {
      expect(getRoleLevel('member')).toBe(25)
    })

    it('should maintain hierarchy: superadmin > org_admin > manager > member', () => {
      expect(getRoleLevel('superadmin')).toBeGreaterThan(getRoleLevel('org_admin'))
      expect(getRoleLevel('org_admin')).toBeGreaterThan(getRoleLevel('manager'))
      expect(getRoleLevel('manager')).toBeGreaterThan(getRoleLevel('member'))
    })
  })

  describe('getPlatformRoleLevel', () => {
    it('should return 100 for superadmin', () => {
      expect(getPlatformRoleLevel('superadmin')).toBe(100)
    })

    it('should return 50 for staff', () => {
      expect(getPlatformRoleLevel('staff')).toBe(50)
    })

    it('should maintain hierarchy: superadmin > staff', () => {
      expect(getPlatformRoleLevel('superadmin')).toBeGreaterThan(
        getPlatformRoleLevel('staff')
      )
    })
  })

  describe('hasRole', () => {
    it('should return true when user role equals required role', () => {
      expect(hasRole('member', 'member')).toBe(true)
      expect(hasRole('manager', 'manager')).toBe(true)
      expect(hasRole('org_admin', 'org_admin')).toBe(true)
      expect(hasRole('superadmin', 'superadmin')).toBe(true)
    })

    it('should return true when user role exceeds required role', () => {
      expect(hasRole('superadmin', 'member')).toBe(true)
      expect(hasRole('superadmin', 'manager')).toBe(true)
      expect(hasRole('superadmin', 'org_admin')).toBe(true)
      expect(hasRole('org_admin', 'manager')).toBe(true)
      expect(hasRole('org_admin', 'member')).toBe(true)
      expect(hasRole('manager', 'member')).toBe(true)
    })

    it('should return false when user role is below required role', () => {
      expect(hasRole('member', 'manager')).toBe(false)
      expect(hasRole('member', 'org_admin')).toBe(false)
      expect(hasRole('member', 'superadmin')).toBe(false)
      expect(hasRole('manager', 'org_admin')).toBe(false)
      expect(hasRole('manager', 'superadmin')).toBe(false)
      expect(hasRole('org_admin', 'superadmin')).toBe(false)
    })
  })

  describe('hasPlatformRole', () => {
    it('should return true when user platform role equals required role', () => {
      expect(hasPlatformRole('superadmin', 'superadmin')).toBe(true)
      expect(hasPlatformRole('staff', 'staff')).toBe(true)
    })

    it('should return true when user platform role exceeds required role', () => {
      expect(hasPlatformRole('superadmin', 'staff')).toBe(true)
    })

    it('should return false when user platform role is below required role', () => {
      expect(hasPlatformRole('staff', 'superadmin')).toBe(false)
    })

    it('should return false when user role is null', () => {
      expect(hasPlatformRole(null, 'superadmin')).toBe(false)
      expect(hasPlatformRole(null, 'staff')).toBe(false)
    })
  })

  describe('isValidRole', () => {
    it('should return true for all valid roles', () => {
      expect(isValidRole('superadmin')).toBe(true)
      expect(isValidRole('org_admin')).toBe(true)
      expect(isValidRole('manager')).toBe(true)
      expect(isValidRole('member')).toBe(true)
    })

    it('should return false for invalid roles', () => {
      expect(isValidRole('admin')).toBe(false)
      expect(isValidRole('staff')).toBe(false)
      expect(isValidRole('user')).toBe(false)
      expect(isValidRole('')).toBe(false)
      expect(isValidRole('SUPERADMIN')).toBe(false)
    })
  })

  describe('isValidOrgRole', () => {
    it('should return true for org-scoped roles', () => {
      expect(isValidOrgRole('org_admin')).toBe(true)
      expect(isValidOrgRole('manager')).toBe(true)
      expect(isValidOrgRole('member')).toBe(true)
    })

    it('should return false for superadmin (not an org role)', () => {
      expect(isValidOrgRole('superadmin')).toBe(false)
    })

    it('should return false for invalid values', () => {
      expect(isValidOrgRole('admin')).toBe(false)
      expect(isValidOrgRole('staff')).toBe(false)
      expect(isValidOrgRole('')).toBe(false)
    })
  })

  describe('isValidPlatformRole', () => {
    it('should return true for valid platform roles', () => {
      expect(isValidPlatformRole('superadmin')).toBe(true)
      expect(isValidPlatformRole('staff')).toBe(true)
    })

    it('should return false for org roles', () => {
      expect(isValidPlatformRole('org_admin')).toBe(false)
      expect(isValidPlatformRole('manager')).toBe(false)
      expect(isValidPlatformRole('member')).toBe(false)
    })

    it('should return false for invalid values', () => {
      expect(isValidPlatformRole('admin')).toBe(false)
      expect(isValidPlatformRole('')).toBe(false)
      expect(isValidPlatformRole('SUPERADMIN')).toBe(false)
    })
  })
})
