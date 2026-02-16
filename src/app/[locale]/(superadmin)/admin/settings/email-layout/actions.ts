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

    type EmailSettingKey = Extract<keyof PlatformSettings, `email.${string}`>

    const mappings: { settingKey: EmailSettingKey; value: unknown }[] = []

    if ('logoUrl' in data) mappings.push({ settingKey: 'email.logo_url', value: data.logoUrl })
    if ('logoLink' in data) mappings.push({ settingKey: 'email.logo_link', value: data.logoLink })
    if ('bgColor' in data) mappings.push({ settingKey: 'email.bg_color', value: data.bgColor })
    if ('contentBgColor' in data) mappings.push({ settingKey: 'email.content_bg_color', value: data.contentBgColor })
    if ('primaryColor' in data) mappings.push({ settingKey: 'email.primary_color', value: data.primaryColor })
    if ('textColor' in data) mappings.push({ settingKey: 'email.text_color', value: data.textColor })
    if ('linkColor' in data) mappings.push({ settingKey: 'email.link_color', value: data.linkColor })
    if ('footerTextDe' in data) mappings.push({ settingKey: 'email.footer_text_de', value: data.footerTextDe })
    if ('footerTextEn' in data) mappings.push({ settingKey: 'email.footer_text_en', value: data.footerTextEn })
    if ('borderRadius' in data) mappings.push({ settingKey: 'email.border_radius', value: data.borderRadius })
    if ('supportEmail' in data) mappings.push({ settingKey: 'email.support_email', value: data.supportEmail })

    for (const { settingKey, value } of mappings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setSetting(settingKey, value as any, currentUser.id)
    }

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
