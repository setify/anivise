'use server'

import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { startImpersonation } from '@/lib/auth/impersonation'
import { logAudit } from '@/lib/audit/log'

export async function startImpersonationAction(orgId: string, orgName: string) {
  const currentUser = await requirePlatformRole('superadmin')

  await startImpersonation(orgId, orgName, 'org_admin')

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'impersonation.started',
    entityType: 'organization',
    entityId: orgId,
    metadata: { orgName },
  })

  return { success: true }
}
