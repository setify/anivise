'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'

export async function updateEmailTemplate(
  templateId: string,
  data: {
    subjectDe: string
    subjectEn: string
    bodyDe: string
    bodyEn: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [template] = await db
      .select({ slug: emailTemplates.slug })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1)

    await db
      .update(emailTemplates)
      .set({
        subjectDe: data.subjectDe,
        subjectEn: data.subjectEn,
        bodyDe: data.bodyDe,
        bodyEn: data.bodyEn,
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      entityId: templateId,
      metadata: { slug: template?.slug },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true }
  } catch (error) {
    console.error('Failed to update email template:', error)
    return { success: false, error: 'Failed to update template' }
  }
}

export async function resetEmailTemplate(
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
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Seed defaults – hardcoded here as the source of truth for reset
    const defaults: Record<
      string,
      { subjectDe: string; subjectEn: string; bodyDe: string; bodyEn: string }
    > = {
      'team-invitation': {
        subjectDe: 'Sie wurden zum Anivise-Team eingeladen',
        subjectEn: 'You have been invited to the Anivise team',
        bodyDe:
          '<h2>Hallo,</h2><p>{{inviterName}} hat Sie eingeladen, dem Anivise-Plattform-Team als <strong>{{role}}</strong> beizutreten.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryDays}} Tage gueltig.</p>',
        bodyEn:
          '<h2>Hello,</h2><p>{{inviterName}} has invited you to join the Anivise platform team as <strong>{{role}}</strong>.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryDays}} days.</p>',
      },
      'org-invitation': {
        subjectDe:
          'Sie wurden als Administrator fuer {{orgName}} eingeladen',
        subjectEn:
          'You have been invited as administrator for {{orgName}}',
        bodyDe:
          '<h2>Hallo,</h2><p>{{inviterName}} hat Sie eingeladen, die Organisation <strong>{{orgName}}</strong> auf Anivise als <strong>{{role}}</strong> zu verwalten.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryDays}} Tage gueltig.</p>',
        bodyEn:
          '<h2>Hello,</h2><p>{{inviterName}} has invited you to manage the organization <strong>{{orgName}}</strong> on Anivise as <strong>{{role}}</strong>.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryDays}} days.</p>',
      },
      welcome: {
        subjectDe: 'Willkommen bei Anivise',
        subjectEn: 'Welcome to Anivise',
        bodyDe:
          '<h2>Willkommen bei Anivise, {{userName}}!</h2><p>Ihr Konto wurde erfolgreich erstellt. Sie koennen sich jetzt anmelden.</p><p><a href="{{loginLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Zur Anmeldung</a></p>',
        bodyEn:
          '<h2>Welcome to Anivise, {{userName}}!</h2><p>Your account has been created successfully. You can now sign in.</p><p><a href="{{loginLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Sign In</a></p>',
      },
      'password-reset': {
        subjectDe: 'Passwort zuruecksetzen',
        subjectEn: 'Reset your password',
        bodyDe:
          '<h2>Hallo {{userName}},</h2><p>Sie haben eine Passwort-Zuruecksetzung angefordert.</p><p><a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Passwort zuruecksetzen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryMinutes}} Minuten gueltig.</p>',
        bodyEn:
          '<h2>Hello {{userName}},</h2><p>You have requested a password reset.</p><p><a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryMinutes}} minutes.</p>',
      },
      'analysis-complete': {
        subjectDe: 'Analyse fuer {{subjectName}} abgeschlossen',
        subjectEn: 'Analysis for {{subjectName}} completed',
        bodyDe:
          '<h2>Hallo {{userName}},</h2><p>Die Analyse fuer <strong>{{subjectName}}</strong> wurde abgeschlossen. Sie koennen den Bericht jetzt einsehen.</p><p><a href="{{reportLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Bericht ansehen</a></p>',
        bodyEn:
          '<h2>Hello {{userName}},</h2><p>The analysis for <strong>{{subjectName}}</strong> has been completed. You can now view the report.</p><p><a href="{{reportLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">View Report</a></p>',
      },
    }

    const defaultTemplate = defaults[slug]
    if (!defaultTemplate) {
      return { success: false, error: 'No default available for this template' }
    }

    await db
      .update(emailTemplates)
      .set({
        ...defaultTemplate,
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.slug, slug))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      metadata: { slug, action: 'reset_to_default' },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true, template: defaultTemplate }
  } catch (error) {
    console.error('Failed to reset email template:', error)
    return { success: false, error: 'Failed to reset template' }
  }
}

// ─── Test Template Email ───

export async function sendTestTemplateEmail(params: {
  subjectDe: string
  subjectEn: string
  bodyDe: string
  bodyEn: string
  templateId: string
  templateSlug: string
  locale: 'de' | 'en'
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const { getEmailLayoutConfig, wrapInBaseLayout } = await import(
      '@/lib/email/send'
    )
    const { getIntegrationSecret } = await import('@/lib/crypto/secrets')

    const layoutConfig = await getEmailLayoutConfig()

    // Use example variables for the test
    const exampleVars: Record<string, string> = {
      inviterName: 'Max Mustermann',
      role: 'Superadmin',
      inviteLink: 'https://app.anivise.com/invite/abc123',
      expiryDays: '7',
      orgName: 'Acme Corp',
      userName: currentUser.email.split('@')[0] || 'User',
      loginLink: 'https://app.anivise.com/login',
      resetLink: 'https://app.anivise.com/reset/abc123',
      expiryMinutes: '60',
      subjectName: 'Thomas Schmidt',
      reportLink: 'https://app.anivise.com/reports/abc123',
    }

    const subject = params.locale === 'de' ? params.subjectDe : params.subjectEn
    const body = params.locale === 'de' ? params.bodyDe : params.bodyEn

    let rendered = body
    let renderedSubject = subject
    for (const [key, value] of Object.entries(exampleVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    }

    const html = wrapInBaseLayout(rendered, params.locale, layoutConfig)

    const apiKey =
      (await getIntegrationSecret('resend', 'api_key')) ||
      process.env.RESEND_API_KEY

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    const fromEmail =
      (await getIntegrationSecret('resend', 'from_email')) ||
      process.env.RESEND_FROM_EMAIL ||
      'noreply@anivise.com'
    const fromName =
      (await getIntegrationSecret('resend', 'from_name')) ||
      layoutConfig.platformName ||
      'Anivise'

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: currentUser.email,
      subject: `[TEST] ${renderedSubject}`,
      html,
    })

    // Update last_test_sent_at
    await db
      .update(emailTemplates)
      .set({ lastTestSentAt: new Date() })
      .where(eq(emailTemplates.id, params.templateId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      entityId: params.templateId,
      metadata: {
        slug: params.templateSlug,
        action: 'email.test_sent',
        recipient: currentUser.email,
        locale: params.locale,
      },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true }
  } catch (error) {
    console.error('Failed to send test email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
    }
  }
}
