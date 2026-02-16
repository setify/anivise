import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSetting, EMAIL_LAYOUT_DEFAULTS } from '@/lib/settings/platform'

/**
 * Renders an email template by replacing {{variable}} placeholders with values.
 */
function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

export interface EmailLayoutConfig {
  logoUrl: string
  logoLink: string
  bgColor: string
  contentBgColor: string
  primaryColor: string
  textColor: string
  linkColor: string
  footerTextDe: string
  footerTextEn: string
  borderRadius: number
  supportEmail: string
  platformName: string
}

/**
 * Loads email layout configuration from platform settings.
 */
export async function getEmailLayoutConfig(): Promise<EmailLayoutConfig> {
  const platformName = await getSetting('platform.name')
  return {
    logoUrl: await getSetting('email.logo_url'),
    logoLink: await getSetting('email.logo_link'),
    bgColor: await getSetting('email.bg_color'),
    contentBgColor: await getSetting('email.content_bg_color'),
    primaryColor: await getSetting('email.primary_color'),
    textColor: await getSetting('email.text_color'),
    linkColor: await getSetting('email.link_color'),
    footerTextDe: await getSetting('email.footer_text_de'),
    footerTextEn: await getSetting('email.footer_text_en'),
    borderRadius: await getSetting('email.border_radius'),
    supportEmail: await getSetting('email.support_email'),
    platformName,
  }
}

/**
 * Wraps email body in a configurable base layout with header and footer.
 */
export function wrapInBaseLayout(
  body: string,
  locale: 'de' | 'en',
  config: EmailLayoutConfig
): string {
  const footerTemplate =
    locale === 'de' ? config.footerTextDe : config.footerTextEn

  const footerText = renderTemplate(footerTemplate, {
    platformName: config.platformName,
    currentYear: new Date().getFullYear().toString(),
    supportEmail: config.supportEmail,
  })

  const logoHtml = config.logoUrl
    ? config.logoLink
      ? `<a href="${config.logoLink}" style="text-decoration:none;"><img src="${config.logoUrl}" alt="${config.platformName}" style="max-height:40px;max-width:200px;" /></a>`
      : `<img src="${config.logoUrl}" alt="${config.platformName}" style="max-height:40px;max-width:200px;" />`
    : `<span style="font-size:20px;font-weight:700;color:${config.primaryColor};">${config.platformName}</span>`

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:${config.bgColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${config.textColor};">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:${config.contentBgColor};border-radius:${config.borderRadius}px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e4e4e7;">
        ${logoHtml}
      </div>
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:#a1a1aa;font-size:12px;">
      <p>${footerText}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Build a default EmailLayoutConfig from EMAIL_LAYOUT_DEFAULTS (no DB calls).
 */
export function getDefaultEmailLayoutConfig(): EmailLayoutConfig {
  return {
    logoUrl: EMAIL_LAYOUT_DEFAULTS['email.logo_url'],
    logoLink: EMAIL_LAYOUT_DEFAULTS['email.logo_link'],
    bgColor: EMAIL_LAYOUT_DEFAULTS['email.bg_color'],
    contentBgColor: EMAIL_LAYOUT_DEFAULTS['email.content_bg_color'],
    primaryColor: EMAIL_LAYOUT_DEFAULTS['email.primary_color'],
    textColor: EMAIL_LAYOUT_DEFAULTS['email.text_color'],
    linkColor: EMAIL_LAYOUT_DEFAULTS['email.link_color'],
    footerTextDe: EMAIL_LAYOUT_DEFAULTS['email.footer_text_de'],
    footerTextEn: EMAIL_LAYOUT_DEFAULTS['email.footer_text_en'],
    borderRadius: EMAIL_LAYOUT_DEFAULTS['email.border_radius'],
    supportEmail: EMAIL_LAYOUT_DEFAULTS['email.support_email'],
    platformName: 'Anivise',
  }
}

/**
 * Loads an email template from the database, renders it with variables,
 * and returns the subject and HTML body ready for sending.
 */
export async function renderTemplatedEmail(params: {
  templateSlug: string
  locale: 'de' | 'en'
  variables: Record<string, string>
}): Promise<{ subject: string; html: string } | null> {
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.slug, params.templateSlug))
    .limit(1)

  if (!template) return null

  const layoutConfig = await getEmailLayoutConfig()

  const subject =
    params.locale === 'de' ? template.subjectDe : template.subjectEn
  const body = params.locale === 'de' ? template.bodyDe : template.bodyEn

  const renderedSubject = renderTemplate(subject, params.variables)
  const renderedBody = renderTemplate(body, params.variables)
  const html = wrapInBaseLayout(renderedBody, params.locale, layoutConfig)

  return { subject: renderedSubject, html }
}

/**
 * Sends an email using a template from the database.
 * Falls back gracefully if Resend is not configured.
 */
export async function sendTemplatedEmail(params: {
  to: string
  templateSlug: string
  locale: 'de' | 'en'
  variables: Record<string, string>
}): Promise<{ success: boolean; error?: string }> {
  const rendered = await renderTemplatedEmail({
    templateSlug: params.templateSlug,
    locale: params.locale,
    variables: params.variables,
  })

  if (!rendered) {
    return { success: false, error: `Template '${params.templateSlug}' not found` }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log(
      `[Email] Would send "${rendered.subject}" to ${params.to} (Resend not configured)`
    )
    return { success: true }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@anivise.com'
    const fromName = (await getSetting('platform.name')) || 'Anivise'

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject: rendered.subject,
      html: rendered.html,
    })

    return { success: true }
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
