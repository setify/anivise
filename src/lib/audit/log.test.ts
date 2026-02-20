import { describe, it, expect } from 'vitest'
import type { AuditAction } from './log'

/**
 * Tests for the AuditAction type definition.
 *
 * Since logAudit requires a database connection, we only test that the
 * AuditAction type system is properly defined by verifying compile-time
 * assignments and checking the expected action categories.
 */
describe('audit/log', () => {
  describe('AuditAction type', () => {
    it('should accept valid organization actions', () => {
      const actions: AuditAction[] = [
        'org.created',
        'org.updated',
        'org.deleted',
        'org.deactivated',
      ]
      expect(actions).toHaveLength(4)
      actions.forEach((action) => {
        expect(action).toMatch(/^org\./)
      })
    })

    it('should accept valid team actions', () => {
      const actions: AuditAction[] = [
        'team.invited',
        'team.role_changed',
        'team.removed',
      ]
      expect(actions).toHaveLength(3)
      actions.forEach((action) => {
        expect(action).toMatch(/^team\./)
      })
    })

    it('should accept valid org_member actions', () => {
      const actions: AuditAction[] = [
        'org_member.invited',
        'org_member.role_changed',
        'org_member.removed',
        'org_member.deactivated',
        'org_member.reactivated',
        'org_member.updated',
        'org_member.created_direct',
      ]
      expect(actions).toHaveLength(7)
      actions.forEach((action) => {
        expect(action).toMatch(/^org_member\./)
      })
    })

    it('should accept valid invitation actions', () => {
      const actions: AuditAction[] = [
        'invitation.accepted',
        'invitation.cancelled',
        'invitation.resent',
        'invitation.revoked',
      ]
      expect(actions).toHaveLength(4)
      actions.forEach((action) => {
        expect(action).toMatch(/^invitation\./)
      })
    })

    it('should accept valid profile and settings actions', () => {
      const actions: AuditAction[] = ['profile.updated', 'settings.updated']
      expect(actions).toHaveLength(2)
    })

    it('should accept valid impersonation actions', () => {
      const actions: AuditAction[] = [
        'impersonation.started',
        'impersonation.ended',
      ]
      expect(actions).toHaveLength(2)
      actions.forEach((action) => {
        expect(action).toMatch(/^impersonation\./)
      })
    })

    it('should accept valid analysis_job actions', () => {
      const actions: AuditAction[] = [
        'analysis_job.retried',
        'analysis_job.cancelled',
      ]
      expect(actions).toHaveLength(2)
      actions.forEach((action) => {
        expect(action).toMatch(/^analysis_job\./)
      })
    })

    it('should accept valid plan actions', () => {
      const actions: AuditAction[] = [
        'plan.assigned',
        'plan.changed',
        'plan.removed',
      ]
      expect(actions).toHaveLength(3)
      actions.forEach((action) => {
        expect(action).toMatch(/^plan\./)
      })
    })

    it('should accept valid media actions', () => {
      const actions: AuditAction[] = [
        'media.uploaded',
        'media.deleted',
        'media.bulk_deleted',
        'media.synced',
      ]
      expect(actions).toHaveLength(4)
      actions.forEach((action) => {
        expect(action).toMatch(/^media\./)
      })
    })

    it('should accept valid department actions', () => {
      const actions: AuditAction[] = [
        'department.created',
        'department.updated',
        'department.deleted',
      ]
      expect(actions).toHaveLength(3)
      actions.forEach((action) => {
        expect(action).toMatch(/^department\./)
      })
    })

    it('should accept valid location actions', () => {
      const actions: AuditAction[] = [
        'location.created',
        'location.updated',
        'location.deleted',
      ]
      expect(actions).toHaveLength(3)
      actions.forEach((action) => {
        expect(action).toMatch(/^location\./)
      })
    })

    it('should accept valid employee actions', () => {
      const actions: AuditAction[] = [
        'employee.created',
        'employee.updated',
        'employee.deleted',
        'employee.status_changed',
      ]
      expect(actions).toHaveLength(4)
      actions.forEach((action) => {
        expect(action).toMatch(/^employee\./)
      })
    })

    it('should accept valid guide actions', () => {
      const actions: AuditAction[] = [
        'guide_category.created',
        'guide_category.updated',
        'guide_category.deleted',
        'guide.created',
        'guide.updated',
        'guide.deleted',
      ]
      expect(actions).toHaveLength(6)
    })

    it('should accept valid analysis actions', () => {
      const actions: AuditAction[] = [
        'analysis.created',
        'analysis.updated',
        'analysis.deleted',
        'analysis.status_changed',
        'analysis.shared',
        'analysis.unshared',
        'analysis.archived',
        'analysis.unarchived',
        'analysis.manager_changed',
        'analysis.form_assigned',
        'analysis.form_unassigned',
      ]
      expect(actions).toHaveLength(11)
      actions.forEach((action) => {
        expect(action).toMatch(/^analysis\./)
      })
    })

    it('should accept notification.broadcast action', () => {
      const action: AuditAction = 'notification.broadcast'
      expect(action).toBe('notification.broadcast')
    })
  })
})
