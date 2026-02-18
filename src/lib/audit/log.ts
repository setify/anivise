import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

export type AuditAction =
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'org.deactivated'
  | 'team.invited'
  | 'team.role_changed'
  | 'team.removed'
  | 'org_member.invited'
  | 'org_member.role_changed'
  | 'org_member.removed'
  | 'invitation.accepted'
  | 'invitation.cancelled'
  | 'invitation.resent'
  | 'profile.updated'
  | 'settings.updated'
  | 'impersonation.started'
  | 'impersonation.ended'
  | 'analysis_job.retried'
  | 'analysis_job.cancelled'
  | 'plan.assigned'
  | 'plan.changed'
  | 'plan.removed'
  | 'media.uploaded'
  | 'media.deleted'
  | 'media.bulk_deleted'
  | 'media.synced'
  | 'org_member.deactivated'
  | 'org_member.reactivated'
  | 'org_member.updated'
  | 'org_member.created_direct'
  | 'department.created'
  | 'department.updated'
  | 'department.deleted'
  | 'location.created'
  | 'location.updated'
  | 'location.deleted'
  | 'invitation.revoked'
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deleted'
  | 'employee.status_changed'
  | 'guide_category.created'
  | 'guide_category.updated'
  | 'guide_category.deleted'
  | 'guide.created'
  | 'guide.updated'
  | 'guide.deleted'

export async function logAudit(params: {
  actorId: string
  actorEmail: string
  action: AuditAction
  entityType: string
  entityId?: string
  organizationId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    organizationId: params.organizationId ?? null,
    metadata: params.metadata ?? null,
    ipAddress: params.ipAddress ?? null,
  })
}
