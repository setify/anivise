import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'

export interface OrgBranding {
  primaryColor: string | null
  accentColor: string | null
  backgroundColor: string | null
  textColor: string | null
  logoUrl: string | null
  faviconUrl: string | null
  emailFooterText: string | null
}

/**
 * Load org branding data for a given orgId.
 * Returns public URLs for logo and favicon from Supabase Storage.
 */
export async function getOrgBranding(orgId: string): Promise<OrgBranding> {
  const [org] = await db
    .select({
      brandPrimaryColor: organizations.brandPrimaryColor,
      brandAccentColor: organizations.brandAccentColor,
      brandBackgroundColor: organizations.brandBackgroundColor,
      brandTextColor: organizations.brandTextColor,
      logoStoragePath: organizations.logoStoragePath,
      faviconStoragePath: organizations.faviconStoragePath,
      emailFooterText: organizations.emailFooterText,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  if (!org) {
    return {
      primaryColor: null,
      accentColor: null,
      backgroundColor: null,
      textColor: null,
      logoUrl: null,
      faviconUrl: null,
      emailFooterText: null,
    }
  }

  // Resolve public URLs for stored assets
  let logoUrl: string | null = null
  let faviconUrl: string | null = null

  if (org.logoStoragePath) {
    const supabase = createAdminClient()
    const { data } = supabase.storage
      .from('org-assets')
      .getPublicUrl(org.logoStoragePath)
    logoUrl = data.publicUrl
  }

  if (org.faviconStoragePath) {
    const supabase = createAdminClient()
    const { data } = supabase.storage
      .from('org-assets')
      .getPublicUrl(org.faviconStoragePath)
    faviconUrl = data.publicUrl
  }

  return {
    primaryColor: org.brandPrimaryColor,
    accentColor: org.brandAccentColor,
    backgroundColor: org.brandBackgroundColor,
    textColor: org.brandTextColor,
    logoUrl,
    faviconUrl,
    emailFooterText: org.emailFooterText,
  }
}
