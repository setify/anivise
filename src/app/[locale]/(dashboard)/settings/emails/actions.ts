'use server'

import { db } from '@/lib/db'
import { emailTemplates, orgEmailTemplateOverrides } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import {
  renderTemplatedEmail,
  getOrgEmailLayoutConfig,
  getEmailLayoutConfig,
  wrapInBaseLayout,
} from '@/lib/email/send'
import type { EmailLayoutConfig } from '@/lib/email/send'

const ORG_TEMPLATE_SLUGS = [
  'org-invitation',
  'direct-create-welcome',
  'analysis-complete',
  'analysis-shared',
  'form-assignment',
  'form-assignment-reminder',
] as const

export interface OrgEmailTemplateData {
  slug: string
  name: string
  description: string | null
  availableVariables: unknown
  subjectDe: string
  subjectEn: string
  bodyDe: string
  bodyEn: string
  hasOverride: boolean
  overrideUpdatedAt: Date | null
}

export async function getOrgEmailTemplates(): Promise<OrgEmailTemplateData[]> {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return []

  // Load the 6 org-relevant global templates
  const templates = await db
    .select()
    .from(emailTemplates)
    .where(inArray(emailTemplates.slug, [...ORG_TEMPLATE_SLUGS]))

  // Load any org overrides
  const overrides = await db
    .select()
    .from(orgEmailTemplateOverrides)
    .where(
      and(
        eq(orgEmailTemplateOverrides.organizationId, ctx.organizationId),
        inArray(orgEmailTemplateOverrides.templateSlug, [...ORG_TEMPLATE_SLUGS])
      )
    )

  const overrideMap = new Map(overrides.map((o) => [o.templateSlug, o]))

  return templates.map((tpl) => {
    const override = overrideMap.get(tpl.slug)
    return {
      slug: tpl.slug,
      name: tpl.name,
      description: tpl.description,
      availableVariables: tpl.availableVariables,
      subjectDe: override?.subjectDe ?? tpl.subjectDe,
      subjectEn: override?.subjectEn ?? tpl.subjectEn,
      bodyDe: override?.bodyDe ?? tpl.bodyDe,
      bodyEn: override?.bodyEn ?? tpl.bodyEn,
      hasOverride: !!override,
      overrideUpdatedAt: override?.updatedAt ?? null,
    }
  })
}

export async function getOrgEmailLayoutConfigAction(): Promise<EmailLayoutConfig | null> {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return null

  return getOrgEmailLayoutConfig(ctx.organizationId)
}

export async function saveOrgEmailTemplate(
  slug: string,
  data: {
    subjectDe: string
    subjectEn: string
    bodyDe: string
    bodyEn: string
  }
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  if (!ORG_TEMPLATE_SLUGS.includes(slug as (typeof ORG_TEMPLATE_SLUGS)[number])) {
    return { success: false, error: 'invalid_template' }
  }

  // Upsert: insert or update on conflict (org_id + slug)
  const [existing] = await db
    .select({ id: orgEmailTemplateOverrides.id })
    .from(orgEmailTemplateOverrides)
    .where(
      and(
        eq(orgEmailTemplateOverrides.organizationId, ctx.organizationId),
        eq(orgEmailTemplateOverrides.templateSlug, slug)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(orgEmailTemplateOverrides)
      .set({
        subjectDe: data.subjectDe,
        subjectEn: data.subjectEn,
        bodyDe: data.bodyDe,
        bodyEn: data.bodyEn,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(orgEmailTemplateOverrides.id, existing.id))
  } else {
    await db.insert(orgEmailTemplateOverrides).values({
      organizationId: ctx.organizationId,
      templateSlug: slug,
      subjectDe: data.subjectDe,
      subjectEn: data.subjectEn,
      bodyDe: data.bodyDe,
      bodyEn: data.bodyEn,
      updatedBy: ctx.userId,
    })
  }

  return { success: true }
}

export async function resetOrgEmailTemplate(
  slug: string
): Promise<{
  success: boolean
  error?: string
  template?: {
    subjectDe: string
    subjectEn: string
    bodyDe: string
    bodyEn: string
  }
}> {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Delete the override
  await db
    .delete(orgEmailTemplateOverrides)
    .where(
      and(
        eq(orgEmailTemplateOverrides.organizationId, ctx.organizationId),
        eq(orgEmailTemplateOverrides.templateSlug, slug)
      )
    )

  // Return the global template values
  const [global] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.slug, slug))
    .limit(1)

  if (!global) return { success: false, error: 'template_not_found' }

  return {
    success: true,
    template: {
      subjectDe: global.subjectDe,
      subjectEn: global.subjectEn,
      bodyDe: global.bodyDe,
      bodyEn: global.bodyEn,
    },
  }
}

export async function sendOrgTestEmail(params: {
  slug: string
  subjectDe: string
  subjectEn: string
  bodyDe: string
  bodyEn: string
  locale: 'de' | 'en'
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Build test variables
  const exampleVars: Record<string, string> = {
    inviterName: 'Max Mustermann',
    inviteLink: 'https://app.anivise.com/invite/test123',
    role: 'Manager',
    expiryDays: '7',
    firstName: 'Maria',
    loginUrl: 'https://app.anivise.com/login',
    email: ctx.email,
    analysisName: 'Test-Analyse',
    analysisLink: 'https://app.anivise.com/analyses/test123',
    sharedBy: 'Max Mustermann',
    employeeName: 'Maria Mueller',
    formTitle: 'Test-Formular',
    organizationName: 'Test Organisation',
    dueDate: '15.03.2026',
    fillLink: 'https://app.anivise.com/form-fill/test123',
    assignerName: 'Max Mustermann',
  }

  const subject = params.locale === 'de' ? params.subjectDe : params.subjectEn
  const body = params.locale === 'de' ? params.bodyDe : params.bodyEn

  // Replace variables
  let renderedSubject = subject
  let renderedBody = body
  for (const [key, val] of Object.entries(exampleVars)) {
    renderedSubject = renderedSubject.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      val
    )
    renderedBody = renderedBody.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      val
    )
  }

  // Use org branding for layout
  const layoutConfig = await getOrgEmailLayoutConfig(ctx.organizationId)
  const html = wrapInBaseLayout(renderedBody, params.locale, layoutConfig)

  const { getCachedSecret } = await import('@/lib/crypto/secrets-cache')
  const resendApiKey =
    (await getCachedSecret('resend', 'api_key')) || process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.log(
      `[Email] Would send test "${renderedSubject}" to ${ctx.email} (Resend not configured)`
    )
    return { success: true }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)
    const { getSetting } = await import('@/lib/settings/platform')

    const fromEmail =
      (await getCachedSecret('resend', 'from_email')) ||
      process.env.RESEND_FROM_EMAIL ||
      'noreply@anivise.com'
    const fromName = (await getSetting('platform.name')) || 'Anivise'

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: ctx.email,
      subject: `[TEST] ${renderedSubject}`,
      html,
    })

    return { success: true }
  } catch (err) {
    console.error('[Email] Test send failed:', err)
    return { success: false, error: 'send_failed' }
  }
}
