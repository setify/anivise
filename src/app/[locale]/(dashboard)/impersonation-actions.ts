'use server'

import { endImpersonation } from '@/lib/auth/impersonation'
import { logAudit } from '@/lib/audit/log'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getImpersonation } from '@/lib/auth/impersonation'

export async function endImpersonationAction() {
  const currentUser = await requirePlatformRole('superadmin')
  const impersonation = await getImpersonation()

  if (impersonation) {
    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'impersonation.ended',
      entityType: 'organization',
      entityId: impersonation.orgId,
      metadata: { orgName: impersonation.orgName },
    })
  }

  await endImpersonation()
}
