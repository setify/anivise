import postgres from 'postgres'

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

const btnStyle = 'display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;'
const hintStyle = 'color:#71717a;font-size:13px;line-height:1.5;'

const missingTemplates = [
  {
    slug: 'direct-create-welcome',
    name: 'Direct Create Welcome',
    description: 'Sent when an org admin creates a user account directly (with password).',
    subject_de: 'Zugangsdaten für Anivise',
    subject_en: 'Anivise Access Credentials',
    body_de: `<h2 style="margin-top:0;">Zugang eingerichtet</h2><p>Ein Konto für <strong>{{firstName}}</strong> wurde auf der Anivise-Plattform erstellt. Die Anmeldung ist ab sofort mit der E-Mail-Adresse <strong>{{email}}</strong> und dem bereitgestellten Passwort möglich.</p><p>Aus Sicherheitsgründen sollte das Passwort nach der ersten Anmeldung geändert werden. Die entsprechende Option findet sich in den Profileinstellungen.</p><p><a href="{{loginUrl}}" style="${btnStyle}">Zur Anmeldung</a></p>`,
    body_en: `<h2 style="margin-top:0;">Account Created</h2><p>An account for <strong>{{firstName}}</strong> has been created on the Anivise platform. Sign-in is now possible using the email address <strong>{{email}}</strong> and the provided password.</p><p>For security reasons, the password should be changed after the first login. The corresponding option can be found in the profile settings.</p><p><a href="{{loginUrl}}" style="${btnStyle}">Sign In</a></p>`,
    available_variables: JSON.stringify(['firstName', 'loginUrl', 'email']),
  },
  {
    slug: 'analysis-shared',
    name: 'Analysis Shared',
    description: 'Sent when an analysis is shared with another user in the organization.',
    subject_de: 'Analyse freigegeben: {{analysisName}}',
    subject_en: 'Analysis shared: {{analysisName}}',
    body_de: `<h2 style="margin-top:0;">Analyse freigegeben</h2><p><strong>{{sharedBy}}</strong> hat die Analyse <strong>{{analysisName}}</strong> zur gemeinsamen Einsicht freigegeben.</p><p>Die Analyse enthält die bisherigen Erkenntnisse, Gesprächsaufzeichnungen und zugehörige Dokumente. Über den folgenden Link kann die Analyse direkt aufgerufen werden:</p><p><a href="{{analysisLink}}" style="${btnStyle}">Analyse öffnen</a></p>`,
    body_en: `<h2 style="margin-top:0;">Analysis Shared</h2><p><strong>{{sharedBy}}</strong> has shared the analysis <strong>{{analysisName}}</strong> for joint review.</p><p>The analysis contains the findings gathered so far, conversation recordings, and associated documents. The following link provides direct access:</p><p><a href="{{analysisLink}}" style="${btnStyle}">Open Analysis</a></p>`,
    available_variables: JSON.stringify(['analysisName', 'analysisLink', 'sharedBy']),
  },
  {
    slug: 'form-assignment',
    name: 'Form Assignment',
    description: 'Sent when a form is assigned to an employee as part of an analysis.',
    subject_de: 'Fragebogen bereitgestellt: {{formTitle}}',
    subject_en: 'Questionnaire assigned: {{formTitle}}',
    body_de: `<h2 style="margin-top:0;">Fragebogen bereitgestellt</h2><p>Im Rahmen eines Entwicklungsprozesses bei <strong>{{organizationName}}</strong> wurde der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bereitgestellt.</p><p>Die Angaben fließen in die Analyse ein und helfen dabei, passende Entwicklungsoptionen und Handlungsmöglichkeiten zu identifizieren. Alle Antworten werden vertraulich behandelt.</p><p><a href="{{fillLink}}" style="${btnStyle}">Fragebogen ausfüllen</a></p><p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
    body_en: `<h2 style="margin-top:0;">Questionnaire Assigned</h2><p>As part of a development process at <strong>{{organizationName}}</strong>, the questionnaire <strong>{{formTitle}}</strong> has been prepared for <strong>{{employeeName}}</strong>.</p><p>The responses will be incorporated into the analysis and help identify suitable development options and courses of action. All answers are treated confidentially.</p><p><a href="{{fillLink}}" style="${btnStyle}">Complete Questionnaire</a></p><p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
    available_variables: JSON.stringify(['employeeName', 'formTitle', 'organizationName', 'dueDate', 'fillLink', 'assignerName']),
  },
  {
    slug: 'form-assignment-reminder',
    name: 'Form Assignment Reminder',
    description: 'Reminder sent when a form assignment has not been completed yet.',
    subject_de: 'Erinnerung: Fragebogen {{formTitle}} ausfüllen',
    subject_en: 'Reminder: Complete questionnaire {{formTitle}}',
    body_de: `<h2 style="margin-top:0;">Erinnerung: Fragebogen ausfüllen</h2><p>Der Fragebogen <strong>{{formTitle}}</strong> für <strong>{{employeeName}}</strong> bei <strong>{{organizationName}}</strong> wurde noch nicht abgeschlossen.</p><p>Die Angaben sind ein wichtiger Bestandteil der laufenden Analyse. Alle Antworten werden vertraulich behandelt und fließen ausschließlich in den Analyseprozess ein.</p><p><a href="{{fillLink}}" style="${btnStyle}">Jetzt ausfüllen</a></p><p style="${hintStyle}">Frist: <strong>{{dueDate}}</strong><br/>Bereitgestellt von {{assignerName}}</p>`,
    body_en: `<h2 style="margin-top:0;">Reminder: Complete Questionnaire</h2><p>The questionnaire <strong>{{formTitle}}</strong> for <strong>{{employeeName}}</strong> at <strong>{{organizationName}}</strong> has not yet been completed.</p><p>The responses are an important part of the ongoing analysis. All answers are treated confidentially and are used exclusively in the analysis process.</p><p><a href="{{fillLink}}" style="${btnStyle}">Complete Now</a></p><p style="${hintStyle}">Deadline: <strong>{{dueDate}}</strong><br/>Assigned by {{assignerName}}</p>`,
    available_variables: JSON.stringify(['employeeName', 'formTitle', 'organizationName', 'dueDate', 'fillLink', 'assignerName']),
  },
]

async function main() {
  for (const tpl of missingTemplates) {
    const existing = await sql`SELECT id FROM email_templates WHERE slug = ${tpl.slug}`
    if (existing.length > 0) {
      console.log(`  ${tpl.slug} already exists, skipping`)
      continue
    }

    await sql`
      INSERT INTO email_templates (slug, name, description, subject_de, subject_en, body_de, body_en, available_variables, is_system)
      VALUES (${tpl.slug}, ${tpl.name}, ${tpl.description}, ${tpl.subject_de}, ${tpl.subject_en}, ${tpl.body_de}, ${tpl.body_en}, ${tpl.available_variables}::jsonb, true)
    `
    console.log(`✓ Seeded ${tpl.slug}`)
  }

  console.log('\nDone.')
  await sql.end()
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message)
  await sql.end()
  process.exit(1)
})
