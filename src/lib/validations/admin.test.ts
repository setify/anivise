import { describe, it, expect } from 'vitest'
import {
  updateProfileSchema,
  inviteTeamMemberSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
  createOrganizationSchema,
  deleteOrganizationSchema,
  updateOrganizationSchema,
} from './admin'

describe('admin validations', () => {
  describe('updateProfileSchema', () => {
    it('should accept a valid full profile update', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'johndoe',
        phone: '+49123456789',
        timezone: 'Europe/Berlin',
        preferredLocale: 'de' as const,
      }
      const result = updateProfileSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept minimal input with only preferredLocale', () => {
      const result = updateProfileSchema.safeParse({ preferredLocale: 'en' })
      expect(result.success).toBe(true)
    })

    it('should reject missing preferredLocale', () => {
      const result = updateProfileSchema.safeParse({ firstName: 'John' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid preferredLocale', () => {
      const result = updateProfileSchema.safeParse({ preferredLocale: 'fr' })
      expect(result.success).toBe(false)
    })

    it('should reject firstName longer than 100 characters', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'a'.repeat(101),
        preferredLocale: 'de',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty firstName (min length 1)', () => {
      const result = updateProfileSchema.safeParse({
        firstName: '',
        preferredLocale: 'de',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional fields as undefined', () => {
      const result = updateProfileSchema.safeParse({
        preferredLocale: 'de',
        firstName: undefined,
        lastName: undefined,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('inviteTeamMemberSchema', () => {
    it('should accept valid email and superadmin role', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'test@example.com',
        role: 'superadmin',
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid email and staff role', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'user@company.org',
        role: 'staff',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'not-an-email',
        role: 'staff',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'test@example.com',
        role: 'member',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const result = inviteTeamMemberSchema.safeParse({ role: 'staff' })
      expect(result.success).toBe(false)
    })

    it('should reject missing role', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'test@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateTeamMemberRoleSchema', () => {
    it('should accept valid UUID userId and role', () => {
      const result = updateTeamMemberRoleSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'superadmin',
      })
      expect(result.success).toBe(true)
    })

    it('should accept staff role', () => {
      const result = updateTeamMemberRoleSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'staff',
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID userId', () => {
      const result = updateTeamMemberRoleSchema.safeParse({
        userId: 'not-a-uuid',
        role: 'staff',
      })
      expect(result.success).toBe(false)
    })

    it('should reject org-level roles (not platform roles)', () => {
      const result = updateTeamMemberRoleSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'org_admin',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('removeTeamMemberSchema', () => {
    it('should accept a valid UUID', () => {
      const result = removeTeamMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID string', () => {
      const result = removeTeamMemberSchema.safeParse({
        userId: 'abc-not-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing userId', () => {
      const result = removeTeamMemberSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('createOrganizationSchema', () => {
    it('should accept valid name and slug', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Acme Corp',
        slug: 'acme-corp',
      })
      expect(result.success).toBe(true)
    })

    it('should accept slug with optional productId', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Test Org',
        slug: 'test-org',
        productId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'A',
        slug: 'aa',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 255 characters', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'a'.repeat(256),
        slug: 'valid-slug',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug shorter than 2 characters', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'a',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug longer than 63 characters', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'a'.repeat(64),
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with uppercase letters', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'Acme-Corp',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug starting with a hyphen', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: '-acme',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug ending with a hyphen', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'acme-',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with spaces', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'acme corp',
      })
      expect(result.success).toBe(false)
    })

    it('should reject slug with underscores', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'acme_corp',
      })
      expect(result.success).toBe(false)
    })

    it('should accept single-word slug', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Acme',
        slug: 'acme',
      })
      expect(result.success).toBe(true)
    })

    it('should accept slug with numbers', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Acme 2',
        slug: 'acme2',
      })
      expect(result.success).toBe(true)
    })

    it('should accept two-character slug', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'AB Corp',
        slug: 'ab',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid productId format', () => {
      const result = createOrganizationSchema.safeParse({
        name: 'Test Org',
        slug: 'test-org',
        productId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteOrganizationSchema', () => {
    it('should accept a valid UUID', () => {
      const result = deleteOrganizationSchema.safeParse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID string', () => {
      const result = deleteOrganizationSchema.safeParse({
        organizationId: 'not-valid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing organizationId', () => {
      const result = deleteOrganizationSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('updateOrganizationSchema', () => {
    const validInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Updated Corp',
      slug: 'updated-corp',
      subscriptionStatus: 'active' as const,
      defaultLocale: 'de' as const,
      internalNotes: 'Some notes',
    }

    it('should accept a fully valid input', () => {
      const result = updateOrganizationSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should accept null for defaultLocale', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        defaultLocale: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept null for internalNotes', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        internalNotes: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept all subscription statuses', () => {
      const statuses = ['trial', 'active', 'cancelled', 'expired'] as const
      for (const status of statuses) {
        const result = updateOrganizationSchema.safeParse({
          ...validInput,
          subscriptionStatus: status,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid subscription status', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        subscriptionStatus: 'pending',
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-UUID id', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid slug format', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        slug: 'INVALID_SLUG!',
      })
      expect(result.success).toBe(false)
    })

    it('should reject internalNotes longer than 5000 characters', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        internalNotes: 'a'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })

    it('should accept internalNotes exactly 5000 characters', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        internalNotes: 'a'.repeat(5000),
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid defaultLocale', () => {
      const result = updateOrganizationSchema.safeParse({
        ...validInput,
        defaultLocale: 'fr',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const result = updateOrganizationSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })
})
