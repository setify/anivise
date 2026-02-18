import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { getOrgBrandingData } from '../actions'
import { BrandingClient } from './branding-client'

export default async function BrandingPage() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) redirect('/dashboard')

  const [orgData, brandingData] = await Promise.all([
    db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getOrgBrandingData(),
  ])

  if (!orgData || !brandingData) redirect('/dashboard')

  return <BrandingClient data={brandingData} orgName={orgData.name} />
}
