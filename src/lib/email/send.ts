import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

/**
 * Wraps email body in a base layout with header and footer.
 */
function wrapInBaseLayout(body: string, locale: 'de' | 'en'): string {
  const footer =
    locale === 'de'
      ? 'Diese E-Mail wurde von der Anivise-Plattform gesendet.'
      : 'This email was sent by the Anivise platform.'

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e4e4e7;">
        <span style="font-size:20px;font-weight:700;color:#1e1b4b;">Anivise</span>
      </div>
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:#a1a1aa;font-size:12px;">
      <p>${footer}</p>
    </div>
  </div>
</body>
</html>`
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

  const subject =
    params.locale === 'de' ? template.subjectDe : template.subjectEn
  const body = params.locale === 'de' ? template.bodyDe : template.bodyEn

  const renderedSubject = renderTemplate(subject, params.variables)
  const renderedBody = renderTemplate(body, params.variables)
  const html = wrapInBaseLayout(renderedBody, params.locale)

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
    // Resend not configured, skip sending
    console.log(
      `[Email] Would send "${rendered.subject}" to ${params.to} (Resend not configured)`
    )
    return { success: true }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@anivise.com',
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
