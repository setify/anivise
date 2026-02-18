import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { getOrgBrandingData } from '../actions'
import { BrandingClient } from './branding-client'

export default async function BrandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (!membership || membership.role !== 'org_admin') redirect('/dashboard')

  const [orgData, brandingData] = await Promise.all([
    db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, membership.organizationId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getOrgBrandingData(),
  ])

  if (!orgData || !brandingData) redirect('/dashboard')

  return <BrandingClient data={brandingData} orgName={orgData.name} />
}
