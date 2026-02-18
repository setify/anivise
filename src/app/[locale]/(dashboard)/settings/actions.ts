'use server'

import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackUpload } from '@/lib/media/track-upload'
import { getCurrentOrgContext } from '@/lib/auth/org-context'

// ─── Auth helper ────────────────────────────────────────────────────────────

async function requireOrgAdmin() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) throw new Error('Unauthorized')
  return ctx
}

// ─── General Settings ───────────────────────────────────────────────────────

export interface OrgGeneralData {
  name: string
  slug: string
  street: string | null
  zipCode: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  taxId: string | null
  industry: string | null
}

export async function getOrgGeneralData(): Promise<OrgGeneralData | null> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [org] = await db
    .select({
      name: organizations.name,
      slug: organizations.slug,
      street: organizations.street,
      zipCode: organizations.zipCode,
      city: organizations.city,
      country: organizations.country,
      phone: organizations.phone,
      email: organizations.email,
      website: organizations.website,
      taxId: organizations.taxId,
      industry: organizations.industry,
    })
    .from(organizations)
    .where(eq(organizations.id, ctx.organizationId))
    .limit(1)

  return org ?? null
}

const updateGeneralSchema = z.object({
  name: z.string().min(1).max(100),
  street: z.string().max(200).optional(),
  zipCode: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(10).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z
    .string()
    .max(200)
    .optional()
    .transform((v) => {
      if (!v) return v
      return v.startsWith('http') ? v : `https://${v}`
    }),
  taxId: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
})

export async function updateOrgGeneralSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, organizationId } = await requireOrgAdmin()

    const raw = {
      name: formData.get('name') as string,
      street: (formData.get('street') as string) || undefined,
      zipCode: (formData.get('zipCode') as string) || undefined,
      city: (formData.get('city') as string) || undefined,
      country: (formData.get('country') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      taxId: (formData.get('taxId') as string) || undefined,
      industry: (formData.get('industry') as string) || undefined,
    }

    const parsed = updateGeneralSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message }
    }

    const d = parsed.data

    await db
      .update(organizations)
      .set({
        name: d.name,
        street: d.street ?? null,
        zipCode: d.zipCode ?? null,
        city: d.city ?? null,
        country: d.country ?? null,
        phone: d.phone ?? null,
        email: d.email ?? null,
        website: d.website ?? null,
        taxId: d.taxId ?? null,
        industry: d.industry ?? null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))

    await logAudit({
      actorId: userId,
      actorEmail: email,
      action: 'org.updated',
      entityType: 'organization',
      entityId: organizationId,
      organizationId,
      metadata: { fields: Object.keys(d) },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ─── Branding Settings ──────────────────────────────────────────────────────

export interface OrgBrandingData {
  brandPrimaryColor: string | null
  brandAccentColor: string | null
  brandBackgroundColor: string | null
  brandTextColor: string | null
  logoStoragePath: string | null
  faviconStoragePath: string | null
  emailFooterText: string | null
  logoPublicUrl: string | null
  faviconPublicUrl: string | null
}

export async function getOrgBrandingData(): Promise<OrgBrandingData | null> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

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
    .where(eq(organizations.id, ctx.organizationId))
    .limit(1)

  if (!org) return null

  const adminSupabase = createAdminClient()
  let logoPublicUrl: string | null = null
  let faviconPublicUrl: string | null = null

  if (org.logoStoragePath) {
    const { data } = adminSupabase.storage
      .from('org-assets')
      .getPublicUrl(org.logoStoragePath)
    logoPublicUrl = data.publicUrl
  }
  if (org.faviconStoragePath) {
    const { data } = adminSupabase.storage
      .from('org-assets')
      .getPublicUrl(org.faviconStoragePath)
    faviconPublicUrl = data.publicUrl
  }

  return { ...org, logoPublicUrl, faviconPublicUrl }
}

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .optional()
  .or(z.literal(''))

const saveBrandingSchema = z.object({
  brandPrimaryColor: hexColorSchema,
  brandAccentColor: hexColorSchema,
  brandBackgroundColor: hexColorSchema,
  brandTextColor: hexColorSchema,
  emailFooterText: z.string().max(200).optional(),
})

export async function saveBrandingSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, organizationId } = await requireOrgAdmin()

    const parsed = saveBrandingSchema.safeParse({
      brandPrimaryColor: formData.get('brandPrimaryColor') || undefined,
      brandAccentColor: formData.get('brandAccentColor') || undefined,
      brandBackgroundColor: formData.get('brandBackgroundColor') || undefined,
      brandTextColor: formData.get('brandTextColor') || undefined,
      emailFooterText: formData.get('emailFooterText') || undefined,
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message }
    }

    const d = parsed.data

    // Handle logo file upload
    const logoFile = formData.get('logoFile') as File | null
    const removeLogo = formData.get('removeLogo') === 'true'
    let logoStoragePathUpdate: string | null | undefined = undefined

    if (removeLogo) {
      logoStoragePathUpdate = null
    } else if (logoFile && logoFile.size > 0) {
      const adminSupabase = createAdminClient()
      const ext = logoFile.name.split('.').pop() ?? 'png'
      const path = `${organizationId}/logo-${Date.now()}.${ext}`
      const bytes = await logoFile.arrayBuffer()
      const { error: uploadError } = await adminSupabase.storage
        .from('org-assets')
        .upload(path, bytes, { contentType: logoFile.type, upsert: true })
      if (!uploadError) {
        logoStoragePathUpdate = path
        await trackUpload({
          bucket: 'org-assets',
          path,
          filename: logoFile.name,
          mimeType: logoFile.type,
          size: logoFile.size,
          context: 'org_logo',
          contextEntityId: organizationId,
          uploadedBy: userId,
        })
      }
    }

    // Handle favicon file upload
    const faviconFile = formData.get('faviconFile') as File | null
    const removeFavicon = formData.get('removeFavicon') === 'true'
    let faviconStoragePathUpdate: string | null | undefined = undefined

    if (removeFavicon) {
      faviconStoragePathUpdate = null
    } else if (faviconFile && faviconFile.size > 0) {
      const adminSupabase = createAdminClient()
      const ext = faviconFile.name.split('.').pop() ?? 'png'
      const path = `${organizationId}/favicon-${Date.now()}.${ext}`
      const bytes = await faviconFile.arrayBuffer()
      const { error: uploadError } = await adminSupabase.storage
        .from('org-assets')
        .upload(path, bytes, { contentType: faviconFile.type, upsert: true })
      if (!uploadError) {
        faviconStoragePathUpdate = path
        await trackUpload({
          bucket: 'org-assets',
          path,
          filename: faviconFile.name,
          mimeType: faviconFile.type,
          size: faviconFile.size,
          context: 'org_logo',
          contextEntityId: organizationId,
          uploadedBy: userId,
        })
      }
    }

    await db
      .update(organizations)
      .set({
        brandPrimaryColor: d.brandPrimaryColor || null,
        brandAccentColor: d.brandAccentColor || null,
        brandBackgroundColor: d.brandBackgroundColor || null,
        brandTextColor: d.brandTextColor || null,
        emailFooterText: d.emailFooterText || null,
        ...(logoStoragePathUpdate !== undefined
          ? { logoStoragePath: logoStoragePathUpdate }
          : {}),
        ...(faviconStoragePathUpdate !== undefined
          ? { faviconStoragePath: faviconStoragePathUpdate }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))

    await logAudit({
      actorId: userId,
      actorEmail: email,
      action: 'org.updated',
      entityType: 'organization',
      entityId: organizationId,
      organizationId,
      metadata: { type: 'branding' },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
