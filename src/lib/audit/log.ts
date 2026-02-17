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
