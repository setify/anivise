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
    const btnStyle = 'display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;'
    const hintStyle = 'color:#71717a;font-size:13px;line-height:1.5;'

    const defaults: Record<
      string,
      { subjectDe: string; subjectEn: string; bodyDe: string; bodyEn: string }
    > = {
      'team-invitation': {
        subjectDe: 'Einladung zum Anivise-Plattform-Team',
        subjectEn: 'Invitation to the Anivise Platform Team',
        bodyDe: `<h2 style="margin-top:0;">Einladung zum Plattform-Team</h2><p>{{inviterName}} hat eine Einladung ausgesprochen, dem Anivise-Plattform-Team in der Rolle <strong>{{role}}</strong> beizutreten.</p><p>Mit dem Beitritt stehen alle Funktionen der Plattformverwaltung zur Verfügung, einschließlich der Verwaltung von Organisationen, Einstellungen und Integrationen.</p><p><a href="{{inviteLink}}" style="${btnStyle}">Einladung annehmen</a></p><p style="${hintStyle}">Dieser Link ist <strong>{{expiryDays}} Tage</strong> gültig. Nach Ablauf muss eine neue Einladung angefordert werden.</p>`,
        bodyEn: `<h2 style="margin-top:0;">Platform Team Invitation</h2><p>{{inviterName}} has extended an invitation to join the Anivise platform team in the role of <strong>{{role}}</strong>.</p><p>Upon joining, all platform management features will be available, including organization management, settings, and integrations.</p><p><a href="{{inviteLink}}" style="${btnStyle}">Accept Invitation</a></p><p style="${hintStyle}">This link is valid for <strong>{{expiryDays}} days</strong>. After expiration, a new invitation will need to be requested.</p>`,
      },
      'org-invitation': {
        subjectDe: 'Einladung zur Organisation {{orgName}}',
        subjectEn: 'Invitation to join {{orgName}}',
        bodyDe: `<h2 style="margin-top:0;">Einladung zur Organisation</h2><p>{{inviterName}} hat eine Einladung ausgesprochen, der Organisation <strong>{{orgName}}</strong> auf Anivise in der Rolle <strong>{{role}}</strong> beizutreten.</p><p>Nach Annahme der Einladung wird der Zugang zur Organisation eingerichtet. Dort stehen – je nach Rolle – Analysen, Mitarbeiterdaten und Einstellungen zur Verfügung.</p><p><a href="{{inviteLink}}" style="${btnStyle}">Einladung annehmen</a></p><p style="${hintStyle}">Dieser Link ist <strong>{{expiryDays}} Tage</strong> gültig. Nach Ablauf muss eine neue Einladung angefordert werden.</p>`,
        bodyEn: `<h2 style="margin-top:0;">Organization Invitation</h2><p>{{inviterName}} has extended an invitation to join the organization <strong>{{orgName}}</strong> on Anivise in the role of <strong>{{role}}</strong>.</p><p>Upon accepting the invitation, access to the organization will be set up. Depending on the assigned role, analyses, employee data, and settings will be available.</p><p><a href="{{inviteLink}}" style="${btnStyle}">Accept Invitation</a></p><p style="${hintStyle}">This link is valid for <strong>{{expiryDays}} days</strong>. After expiration, a new invitation will need to be requested.</p>`,
      },
      welcome: {
        subjectDe: 'Willkommen bei Anivise',
        subjectEn: 'Welcome to Anivise',
        bodyDe: `<h2 style="margin-top:0;">Willkommen bei Anivise</h2><p>Das Konto für <strong>{{userName}}</strong> wurde erfolgreich erstellt und ist ab sofort einsatzbereit.</p><p>Nach der ersten Anmeldung empfiehlt es sich, das Profil zu vervollständigen und die Benachrichtigungseinstellungen anzupassen.</p><p><a href="{{loginLink}}" style="${btnStyle}">Zur Anmeldung</a></p>`,
        bodyEn: `<h2 style="margin-top:0;">Welcome to Anivise</h2><p>The account for <strong>{{userName}}</strong> has been successfully created and is ready to use.</p><p>After the first login, it is recommended to complete the profile and adjust the notification settings.</p><p><a href="{{loginLink}}" style="${btnStyle}">Sign In</a></p>`,
      },
      'password-reset': {
        subjectDe: 'Passwort zurücksetzen',
        subjectEn: 'Password Reset Request',
        bodyDe: `<h2 style="margin-top:0;">Passwort zurücksetzen</h2><p>Für das Konto von <strong>{{userName}}</strong> wurde eine Anfrage zum Zurücksetzen des Passworts gestellt.</p><p>Über den folgenden Link kann ein neues Passwort vergeben werden:</p><p><a href="{{resetLink}}" style="${btnStyle}">Neues Passwort vergeben</a></p><p style="${hintStyle}">Dieser Link ist <strong>{{expiryMinutes}} Minuten</strong> gültig.</p><p style="${hintStyle}">Falls diese Anfrage nicht selbst gestellt wurde, kann diese E-Mail ignoriert werden. Das bestehende Passwort bleibt in diesem Fall unverändert.</p>`,
        bodyEn: `<h2 style="margin-top:0;">Password Reset</h2><p>A password reset has been requested for the account of <strong>{{userName}}</strong>.</p><p>The following link can be used to set a new password:</p><p><a href="{{resetLink}}" style="${btnStyle}">Set New Password</a></p><p style="${hintStyle}">This link is valid for <strong>{{expiryMinutes}} minutes</strong>.</p><p style="${hintStyle}">If this request was not made intentionally, this email can be safely ignored. The existing password will remain unchanged.</p>`,
      },
      'analysis-complete': {
        subjectDe: 'Analyse abgeschlossen: {{subjectName}}',
        subjectEn: 'Analysis completed: {{subjectName}}',
        bodyDe: `<h2 style="margin-top:0;">Analyse abgeschlossen</h2><p>Die Analyse für <strong>{{subjectName}}</strong> wurde erfolgreich abgeschlossen. Der Bericht mit den identifizierten Mustern und Handlungsoptionen steht nun zur Einsicht bereit.</p><p>Der Bericht enthält eine strukturierte Auswertung der Gesprächsdaten und bietet Orientierung für die nächsten Schritte.</p><p><a href="{{reportLink}}" style="${btnStyle}">Bericht einsehen</a></p><p style="${hintStyle}">Hinweis: Der Bericht zeigt mögliche Muster auf und dient als Orientierung – nicht als abschließende Bewertung.</p>`,
        bodyEn: `<h2 style="margin-top:0;">Analysis Completed</h2><p>The analysis for <strong>{{subjectName}}</strong> has been successfully completed. The report with identified patterns and action options is now available for review.</p><p>The report contains a structured evaluation of the conversation data and provides orientation for the next steps.</p><p><a href="{{reportLink}}" style="${btnStyle}">View Report</a></p><p style="${hintStyle}">Note: The report highlights possible patterns and serves as orientation – not as a definitive assessment.</p>`,
      },
      'direct-create-welcome': {
        subjectDe: 'Zugangsdaten für Anivise',
        subjectEn: 'Anivise Access Credentials',
        bodyDe: `<h2 style="margin-top:0;">Zugang eingerichtet</h2><p>Ein Konto für <strong>{{firstName}}</strong> wurde auf der Anivise-Plattform erstellt. Die Anmeldung ist ab sofort mit der E-Mail-Adresse <strong>{{email}}</strong> und dem bereitgestellten Passwort möglich.</p><p>Aus Sicherheitsgründen sollte das Passwort nach der ersten Anmeldung geändert werden. Die entsprechende Option findet sich in den Profileinstellungen.</p><p><a href="{{loginUrl}}" style="${btnStyle}">Zur Anmeldung</a></p>`,
        bodyEn: `<h2 style="margin-top:0;">Account Created</h2><p>An account for <strong>{{firstName}}</strong> has been created on the Anivise platform. Sign-in is now possible using the email address <strong>{{email}}</strong> and the provided password.</p><p>For security reasons, the password should be changed after the first login. The corresponding option can be found in the profile settings.</p><p><a href="{{loginUrl}}" style="${btnStyle}">Sign In</a></p>`,
      },
      'analysis-shared': {
        subjectDe: 'Analyse freigegeben: {{analysisName}}',
        subjectEn: 'Analysis shared: {{analysisName}}',
        bodyDe: `<h2 style="margin-top:0;">Analyse freigegeben</h2><p><strong>{{sharedBy}}</strong> hat die Analyse <strong>{{analysisName}}</strong> zur gemeinsamen Einsicht freigegeben.</p><p>Die Analyse enthält die bisherigen Erkenntnisse, Gesprächsaufzeichnungen und zugehörige Dokumente. Über den folgenden Link kann die Analyse direkt aufgerufen werden:</p><p><a href="{{analysisLink}}" style="${btnStyle}">Analyse öffnen</a></p>`,
        bodyEn: `<h2 style="margin-top:0;">Analysis Shared</h2><p><strong>{{sharedBy}}</strong> has shared the analysis <strong>{{analysisName}}</strong> for joint review.</p><p>The analysis contains the findings gathered so far, conversation recordings, and associated documents. The following link provides direct access:</p><p><a href="{{analysisLink}}" style="${btnStyle}">Open Analysis</a></p>`,
      },
      'form-assignment': {
        subjectDe: 'Fragebogen bereitgestellt: {{formTitle}}',
        subjectEn: 'Questionnaire assigned: {{formTitle}}',
        bodyDe: `<h2 style="margin-top:0;">Fragebogen bereitgestellt</h2><p>Im Rahmen eines Entwicklungsprozesses bei <strong>{{organizationName}}</strong> wurde der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bereitgestellt.</p><p>Die Angaben fließen in die Analyse ein und helfen dabei, passende Entwicklungsoptionen und Handlungsmöglichkeiten zu identifizieren. Alle Antworten werden vertraulich behandelt.</p><p><a href="{{fillLink}}" style="${btnStyle}">Fragebogen ausfüllen</a></p><p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
        bodyEn: `<h2 style="margin-top:0;">Questionnaire Assigned</h2><p>As part of a development process at <strong>{{organizationName}}</strong>, the questionnaire <strong>{{formTitle}}</strong> has been prepared for <strong>{{employeeName}}</strong>.</p><p>The responses will be incorporated into the analysis and help identify suitable development options and courses of action. All answers are treated confidentially.</p><p><a href="{{fillLink}}" style="${btnStyle}">Complete Questionnaire</a></p><p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
      },
      'form-assignment-reminder': {
        subjectDe: 'Erinnerung: Fragebogen {{formTitle}} ausfüllen',
        subjectEn: 'Reminder: Complete questionnaire {{formTitle}}',
        bodyDe: `<h2 style="margin-top:0;">Erinnerung: Fragebogen ausfüllen</h2><p>Der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bei <strong>{{organizationName}}</strong> wurde noch nicht abgeschlossen.</p><p>Die Angaben sind ein wichtiger Bestandteil der laufenden Analyse. Alle Antworten werden vertraulich behandelt und fließen ausschließlich in den Analyseprozess ein.</p><p><a href="{{fillLink}}" style="${btnStyle}">Jetzt ausfüllen</a></p><p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
        bodyEn: `<h2 style="margin-top:0;">Reminder: Complete Questionnaire</h2><p>The questionnaire <strong>{{formTitle}}</strong> for <strong>{{employeeName}}</strong> at <strong>{{organizationName}}</strong> has not yet been completed.</p><p>The responses are an important part of the ongoing analysis. All answers are treated confidentially and are used exclusively in the analysis process.</p><p><a href="{{fillLink}}" style="${btnStyle}">Complete Now</a></p><p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
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
