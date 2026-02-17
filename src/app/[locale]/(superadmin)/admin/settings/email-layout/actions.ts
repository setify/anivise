'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import { setSetting, getSetting, type PlatformSettings } from '@/lib/settings/platform'
import {
  getEmailLayoutConfig,
  wrapInBaseLayout,
  type EmailLayoutConfig,
} from '@/lib/email/send'
import { getIntegrationSecret } from '@/lib/crypto/secrets'

export async function saveEmailLayout(
  data: Partial<EmailLayoutConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    async function saveIfPresent<K extends keyof PlatformSettings>(
      field: keyof EmailLayoutConfig,
      settingKey: K,
      value: PlatformSettings[K] | undefined
    ) {
      if (field in data && value !== undefined) {
        await setSetting(settingKey, value, currentUser.id)
      }
    }

    await saveIfPresent('logoUrl', 'email.logo_url', data.logoUrl)
    await saveIfPresent('logoLink', 'email.logo_link', data.logoLink)
    await saveIfPresent('bgColor', 'email.bg_color', data.bgColor)
    await saveIfPresent('contentBgColor', 'email.content_bg_color', data.contentBgColor)
    await saveIfPresent('primaryColor', 'email.primary_color', data.primaryColor)
    await saveIfPresent('textColor', 'email.text_color', data.textColor)
    await saveIfPresent('linkColor', 'email.link_color', data.linkColor)
    await saveIfPresent('footerTextDe', 'email.footer_text_de', data.footerTextDe)
    await saveIfPresent('footerTextEn', 'email.footer_text_en', data.footerTextEn)
    await saveIfPresent('borderRadius', 'email.border_radius', data.borderRadius)
    await saveIfPresent('supportEmail', 'email.support_email', data.supportEmail)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'platform_settings',
      metadata: {
        section: 'email_layout',
        action: 'email_layout.updated',
        keys: Object.keys(data),
      },
    })

    revalidatePath('/admin/settings/email-layout')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save email layout' }
  }
}

export async function sendTestLayoutEmail(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const config = await getEmailLayoutConfig()

    const sampleBody = `
      <h2 style="margin:0 0 16px;color:${config.textColor};">Test E-Mail Layout</h2>
      <p style="margin:0 0 12px;color:${config.textColor};line-height:1.6;">
        Dies ist eine Test-E-Mail, um das aktuelle E-Mail-Layout zu &uuml;berpr&uuml;fen.
        Farben, Logo und Footer werden aus den konfigurierten Einstellungen geladen.
      </p>
      <p style="margin:0 0 24px;color:${config.textColor};line-height:1.6;">
        This is a test email to verify the current email layout.
        Colors, logo, and footer are loaded from the configured settings.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="#" style="display:inline-block;background:${config.primaryColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:${Math.min(config.borderRadius, 8)}px;font-weight:600;">
          Example Button
        </a>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">
        <a href="#" style="color:${config.linkColor};text-decoration:underline;">Example Link</a> &mdash; Timestamp: ${new Date().toISOString()}
      </p>
    `

    const html = wrapInBaseLayout(sampleBody, 'de', config)

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
      (await getSetting('platform.name')) ||
      'Anivise'

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: currentUser.email,
      subject: `[TEST] ${config.platformName} E-Mail Layout`,
      html,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'platform_settings',
      metadata: {
        action: 'email_layout.test_sent',
        recipient: currentUser.email,
      },
    })

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send test email',
    }
  }
}
