import { redirect } from 'next/navigation'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { listOrgMedia } from './actions'
import { OrgMediaClient } from './media-client'
import { getOrganizationLimits } from '@/lib/products/limits'

export default async function OrgMediaPage() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) redirect('/dashboard')

  const [mediaResult, limits] = await Promise.all([
    listOrgMedia(),
    getOrganizationLimits(ctx.organizationId),
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
