import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { organizationMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { listOrgMedia } from './actions'
import { OrgMediaClient } from './media-client'
import { getOrganizationLimits } from '@/lib/products/limits'

export default async function OrgMediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (!membership || membership.role !== 'org_admin') redirect('/dashboard')

  const [mediaResult, limits] = await Promise.all([
    listOrgMedia(),
    getOrganizationLimits(membership.organizationId),
  ])

  const files = mediaResult.data ?? []
  const usedStorageMb = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024)

  return (
    <OrgMediaClient
      initialFiles={files}
      storageLimitMb={limits.maxStorageMb}
      usedStorageMb={usedStorageMb}
    />
  )
}
