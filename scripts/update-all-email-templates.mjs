import postgres from 'postgres'

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'
const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

const btnStyle = 'display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;'
const hintStyle = 'color:#71717a;font-size:13px;line-height:1.5;'

const templates = [
  // ─── 1. team-invitation (Superadmin) ────────────────────────────────
  {
    slug: 'team-invitation',
    subject_de: 'Einladung zum Anivise-Plattform-Team',
    subject_en: 'Invitation to the Anivise Platform Team',
    body_de: [
      '<h2 style="margin-top:0;">Einladung zum Plattform-Team</h2>',
      '<p>{{inviterName}} hat eine Einladung ausgesprochen, dem Anivise-Plattform-Team in der Rolle <strong>{{role}}</strong> beizutreten.</p>',
      '<p>Mit dem Beitritt stehen alle Funktionen der Plattformverwaltung zur Verfügung, einschließlich der Verwaltung von Organisationen, Einstellungen und Integrationen.</p>',
      `<p><a href="{{inviteLink}}" style="${btnStyle}">Einladung annehmen</a></p>`,
      `<p style="${hintStyle}">Dieser Link ist <strong>{{expiryDays}} Tage</strong> gültig. Nach Ablauf muss eine neue Einladung angefordert werden.</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Platform Team Invitation</h2>',
      '<p>{{inviterName}} has extended an invitation to join the Anivise platform team in the role of <strong>{{role}}</strong>.</p>',
      '<p>Upon joining, all platform management features will be available, including organization management, settings, and integrations.</p>',
      `<p><a href="{{inviteLink}}" style="${btnStyle}">Accept Invitation</a></p>`,
      `<p style="${hintStyle}">This link is valid for <strong>{{expiryDays}} days</strong>. After expiration, a new invitation will need to be requested.</p>`,
    ].join(''),
  },

  // ─── 2. org-invitation (Org + Superadmin) ──────────────────────────
  {
    slug: 'org-invitation',
    subject_de: 'Einladung zur Organisation {{orgName}}',
    subject_en: 'Invitation to join {{orgName}}',
    body_de: [
      '<h2 style="margin-top:0;">Einladung zur Organisation</h2>',
      '<p>{{inviterName}} hat eine Einladung ausgesprochen, der Organisation <strong>{{orgName}}</strong> auf Anivise in der Rolle <strong>{{role}}</strong> beizutreten.</p>',
      '<p>Nach Annahme der Einladung wird der Zugang zur Organisation eingerichtet. Dort stehen – je nach Rolle – Analysen, Mitarbeiterdaten und Einstellungen zur Verfügung.</p>',
      `<p><a href="{{inviteLink}}" style="${btnStyle}">Einladung annehmen</a></p>`,
      `<p style="${hintStyle}">Dieser Link ist <strong>{{expiryDays}} Tage</strong> gültig. Nach Ablauf muss eine neue Einladung angefordert werden.</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Organization Invitation</h2>',
      '<p>{{inviterName}} has extended an invitation to join the organization <strong>{{orgName}}</strong> on Anivise in the role of <strong>{{role}}</strong>.</p>',
      '<p>Upon accepting the invitation, access to the organization will be set up. Depending on the assigned role, analyses, employee data, and settings will be available.</p>',
      `<p><a href="{{inviteLink}}" style="${btnStyle}">Accept Invitation</a></p>`,
      `<p style="${hintStyle}">This link is valid for <strong>{{expiryDays}} days</strong>. After expiration, a new invitation will need to be requested.</p>`,
    ].join(''),
  },

  // ─── 3. welcome (Superadmin) ───────────────────────────────────────
  {
    slug: 'welcome',
    subject_de: 'Willkommen bei Anivise',
    subject_en: 'Welcome to Anivise',
    body_de: [
      '<h2 style="margin-top:0;">Willkommen bei Anivise</h2>',
      '<p>Das Konto für <strong>{{userName}}</strong> wurde erfolgreich erstellt und ist ab sofort einsatzbereit.</p>',
      '<p>Nach der ersten Anmeldung empfiehlt es sich, das Profil zu vervollständigen und die Benachrichtigungseinstellungen anzupassen.</p>',
      `<p><a href="{{loginLink}}" style="${btnStyle}">Zur Anmeldung</a></p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Welcome to Anivise</h2>',
      '<p>The account for <strong>{{userName}}</strong> has been successfully created and is ready to use.</p>',
      '<p>After the first login, it is recommended to complete the profile and adjust the notification settings.</p>',
      `<p><a href="{{loginLink}}" style="${btnStyle}">Sign In</a></p>`,
    ].join(''),
  },

  // ─── 4. password-reset (Superadmin) ────────────────────────────────
  {
    slug: 'password-reset',
    subject_de: 'Passwort zurücksetzen',
    subject_en: 'Password Reset Request',
    body_de: [
      '<h2 style="margin-top:0;">Passwort zurücksetzen</h2>',
      '<p>Für das Konto von <strong>{{userName}}</strong> wurde eine Anfrage zum Zurücksetzen des Passworts gestellt.</p>',
      '<p>Über den folgenden Link kann ein neues Passwort vergeben werden:</p>',
      `<p><a href="{{resetLink}}" style="${btnStyle}">Neues Passwort vergeben</a></p>`,
      `<p style="${hintStyle}">Dieser Link ist <strong>{{expiryMinutes}} Minuten</strong> gültig.</p>`,
      `<p style="${hintStyle}">Falls diese Anfrage nicht selbst gestellt wurde, kann diese E-Mail ignoriert werden. Das bestehende Passwort bleibt in diesem Fall unverändert.</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Password Reset</h2>',
      '<p>A password reset has been requested for the account of <strong>{{userName}}</strong>.</p>',
      '<p>The following link can be used to set a new password:</p>',
      `<p><a href="{{resetLink}}" style="${btnStyle}">Set New Password</a></p>`,
      `<p style="${hintStyle}">This link is valid for <strong>{{expiryMinutes}} minutes</strong>.</p>`,
      `<p style="${hintStyle}">If this request was not made intentionally, this email can be safely ignored. The existing password will remain unchanged.</p>`,
    ].join(''),
  },

  // ─── 5. analysis-complete (Org + Superadmin) ──────────────────────
  {
    slug: 'analysis-complete',
    subject_de: 'Analyse abgeschlossen: {{subjectName}}',
    subject_en: 'Analysis completed: {{subjectName}}',
    body_de: [
      '<h2 style="margin-top:0;">Analyse abgeschlossen</h2>',
      '<p>Die Analyse für <strong>{{subjectName}}</strong> wurde erfolgreich abgeschlossen. Der Bericht mit den identifizierten Mustern und Handlungsoptionen steht nun zur Einsicht bereit.</p>',
      '<p>Der Bericht enthält eine strukturierte Auswertung der Gesprächsdaten und bietet Orientierung für die nächsten Schritte.</p>',
      `<p><a href="{{reportLink}}" style="${btnStyle}">Bericht einsehen</a></p>`,
      `<p style="${hintStyle}">Hinweis: Der Bericht zeigt mögliche Muster auf und dient als Orientierung – nicht als abschließende Bewertung.</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Analysis Completed</h2>',
      '<p>The analysis for <strong>{{subjectName}}</strong> has been successfully completed. The report with identified patterns and action options is now available for review.</p>',
      '<p>The report contains a structured evaluation of the conversation data and provides orientation for the next steps.</p>',
      `<p><a href="{{reportLink}}" style="${btnStyle}">View Report</a></p>`,
      `<p style="${hintStyle}">Note: The report highlights possible patterns and serves as orientation – not as a definitive assessment.</p>`,
    ].join(''),
  },

  // ─── 6. direct-create-welcome (Org) ────────────────────────────────
  {
    slug: 'direct-create-welcome',
    subject_de: 'Zugangsdaten für Anivise',
    subject_en: 'Anivise Access Credentials',
    body_de: [
      '<h2 style="margin-top:0;">Zugang eingerichtet</h2>',
      '<p>Ein Konto für <strong>{{firstName}}</strong> wurde auf der Anivise-Plattform erstellt. Die Anmeldung ist ab sofort mit der E-Mail-Adresse <strong>{{email}}</strong> und dem bereitgestellten Passwort möglich.</p>',
      '<p>Aus Sicherheitsgründen sollte das Passwort nach der ersten Anmeldung geändert werden. Die entsprechende Option findet sich in den Profileinstellungen.</p>',
      `<p><a href="{{loginUrl}}" style="${btnStyle}">Zur Anmeldung</a></p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Account Created</h2>',
      '<p>An account for <strong>{{firstName}}</strong> has been created on the Anivise platform. Sign-in is now possible using the email address <strong>{{email}}</strong> and the provided password.</p>',
      '<p>For security reasons, the password should be changed after the first login. The corresponding option can be found in the profile settings.</p>',
      `<p><a href="{{loginUrl}}" style="${btnStyle}">Sign In</a></p>`,
    ].join(''),
  },

  // ─── 7. analysis-shared (Org) ──────────────────────────────────────
  {
    slug: 'analysis-shared',
    subject_de: 'Analyse freigegeben: {{analysisName}}',
    subject_en: 'Analysis shared: {{analysisName}}',
    body_de: [
      '<h2 style="margin-top:0;">Analyse freigegeben</h2>',
      '<p><strong>{{sharedBy}}</strong> hat die Analyse <strong>{{analysisName}}</strong> zur gemeinsamen Einsicht freigegeben.</p>',
      '<p>Die Analyse enthält die bisherigen Erkenntnisse, Gesprächsaufzeichnungen und zugehörige Dokumente. Über den folgenden Link kann die Analyse direkt aufgerufen werden:</p>',
      `<p><a href="{{analysisLink}}" style="${btnStyle}">Analyse öffnen</a></p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Analysis Shared</h2>',
      '<p><strong>{{sharedBy}}</strong> has shared the analysis <strong>{{analysisName}}</strong> for joint review.</p>',
      '<p>The analysis contains the findings gathered so far, conversation recordings, and associated documents. The following link provides direct access:</p>',
      `<p><a href="{{analysisLink}}" style="${btnStyle}">Open Analysis</a></p>`,
    ].join(''),
  },

  // ─── 8. form-assignment (Org) ──────────────────────────────────────
  {
    slug: 'form-assignment',
    subject_de: 'Fragebogen bereitgestellt: {{formTitle}}',
    subject_en: 'Questionnaire assigned: {{formTitle}}',
    body_de: [
      '<h2 style="margin-top:0;">Fragebogen bereitgestellt</h2>',
      '<p>Im Rahmen eines Entwicklungsprozesses bei <strong>{{organizationName}}</strong> wurde der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bereitgestellt.</p>',
      '<p>Die Angaben fließen in die Analyse ein und helfen dabei, passende Entwicklungsoptionen und Handlungsmöglichkeiten zu identifizieren. Alle Antworten werden vertraulich behandelt.</p>',
      `<p><a href="{{fillLink}}" style="${btnStyle}">Fragebogen ausfüllen</a></p>`,
      `<p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Questionnaire Assigned</h2>',
      '<p>As part of a development process at <strong>{{organizationName}}</strong>, the questionnaire <strong>{{formTitle}}</strong> has been prepared for <strong>{{employeeName}}</strong>.</p>',
      '<p>The responses will be incorporated into the analysis and help identify suitable development options and courses of action. All answers are treated confidentially.</p>',
      `<p><a href="{{fillLink}}" style="${btnStyle}">Complete Questionnaire</a></p>`,
      `<p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
    ].join(''),
  },

  // ─── 9. form-assignment-reminder (Org) ─────────────────────────────
  {
    slug: 'form-assignment-reminder',
    subject_de: 'Erinnerung: Fragebogen {{formTitle}} ausfüllen',
    subject_en: 'Reminder: Complete questionnaire {{formTitle}}',
    body_de: [
      '<h2 style="margin-top:0;">Erinnerung: Fragebogen ausfüllen</h2>',
      '<p>Der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bei <strong>{{organizationName}}</strong> wurde noch nicht abgeschlossen.</p>',
      '<p>Die Angaben sind ein wichtiger Bestandteil der laufenden Analyse. Alle Antworten werden vertraulich behandelt und fließen ausschließlich in den Analyseprozess ein.</p>',
      `<p><a href="{{fillLink}}" style="${btnStyle}">Jetzt ausfüllen</a></p>`,
      `<p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
    ].join(''),
    body_en: [
      '<h2 style="margin-top:0;">Reminder: Complete Questionnaire</h2>',
      '<p>The questionnaire <strong>{{formTitle}}</strong> for <strong>{{employeeName}}</strong> at <strong>{{organizationName}}</strong> has not yet been completed.</p>',
      '<p>The responses are an important part of the ongoing analysis. All answers are treated confidentially and are used exclusively in the analysis process.</p>',
      `<p><a href="{{fillLink}}" style="${btnStyle}">Complete Now</a></p>`,
      `<p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
    ].join(''),
  },
]

async function main() {
  for (const tpl of templates) {
    const existing = await sql`SELECT id FROM email_templates WHERE slug = ${tpl.slug}`
    if (existing.length === 0) {
      console.log(`  ${tpl.slug} not found in DB, skipping`)
      continue
    }

    await sql`
      UPDATE email_templates
      SET subject_de = ${tpl.subject_de},
          subject_en = ${tpl.subject_en},
          body_de = ${tpl.body_de},
          body_en = ${tpl.body_en},
          updated_at = NOW()
      WHERE slug = ${tpl.slug}
    `
    console.log(`✓ Updated ${tpl.slug}`)
  }

  console.log('\nAll templates updated.')
  await sql.end()
}

main().catch(async (err) => {
  console.error('Update failed:', err.message)
  await sql.end()
  process.exit(1)
})
