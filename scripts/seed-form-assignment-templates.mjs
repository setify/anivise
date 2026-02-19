import postgres from 'postgres'

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'
const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

const templates = [
  {
    slug: 'form-assignment',
    name: 'Formular-Zuweisung',
    description: 'Wird gesendet, wenn einem Mitarbeiter ein Formular zugewiesen wird.',
    subject_de: 'Bitte füllen Sie ein Formular aus',
    subject_en: 'Please fill out a form',
    body_de: `<h2 style="font-size:20px;font-weight:600;margin:0 0 16px;">Hallo {{employeeName}},</h2>
<p style="margin:0 0 12px;line-height:1.6;">{{assignerName}} von {{organizationName}} hat Sie gebeten, ein Formular auszufüllen:</p>
<p style="margin:0 0 8px;font-weight:600;font-size:16px;">{{formTitle}}</p>
<p style="margin:0 0 24px;line-height:1.6;">Bitte klicken Sie auf den folgenden Button, um das Formular zu öffnen und auszufüllen.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{fillLink}}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;">Formular ausfüllen</a>
</div>
<p style="margin:16px 0 0;color:#71717a;font-size:13px;">Dieser Link ist 30 Tage gültig.</p>`,
    body_en: `<h2 style="font-size:20px;font-weight:600;margin:0 0 16px;">Hello {{employeeName}},</h2>
<p style="margin:0 0 12px;line-height:1.6;">{{assignerName}} from {{organizationName}} has asked you to fill out a form:</p>
<p style="margin:0 0 8px;font-weight:600;font-size:16px;">{{formTitle}}</p>
<p style="margin:0 0 24px;line-height:1.6;">Please click the button below to open and complete the form.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{fillLink}}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;">Fill out form</a>
</div>
<p style="margin:16px 0 0;color:#71717a;font-size:13px;">This link is valid for 30 days.</p>`,
    available_variables: JSON.stringify([
      'employeeName',
      'formTitle',
      'organizationName',
      'dueDate',
      'fillLink',
      'assignerName',
    ]),
  },
  {
    slug: 'form-assignment-reminder',
    name: 'Formular-Erinnerung',
    description: 'Erinnerungs-E-Mail für noch nicht ausgefüllte Formulare.',
    subject_de: 'Erinnerung: Formular noch nicht ausgefüllt',
    subject_en: 'Reminder: Form not yet completed',
    body_de: `<h2 style="font-size:20px;font-weight:600;margin:0 0 16px;">Hallo {{employeeName}},</h2>
<p style="margin:0 0 12px;line-height:1.6;">Dies ist eine freundliche Erinnerung, dass das folgende Formular noch auf Ihre Antworten wartet:</p>
<p style="margin:0 0 8px;font-weight:600;font-size:16px;">{{formTitle}}</p>
<p style="margin:0 0 24px;line-height:1.6;">Bitte nehmen Sie sich einen Moment Zeit, um das Formular auszufüllen.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{fillLink}}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;">Formular ausfüllen</a>
</div>
<p style="margin:16px 0 0;color:#71717a;font-size:13px;">Dieser Link ist 30 Tage ab Zuweisung gültig.</p>`,
    body_en: `<h2 style="font-size:20px;font-weight:600;margin:0 0 16px;">Hello {{employeeName}},</h2>
<p style="margin:0 0 12px;line-height:1.6;">This is a friendly reminder that the following form is still awaiting your response:</p>
<p style="margin:0 0 8px;font-weight:600;font-size:16px;">{{formTitle}}</p>
<p style="margin:0 0 24px;line-height:1.6;">Please take a moment to complete the form.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{fillLink}}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;">Fill out form</a>
</div>
<p style="margin:16px 0 0;color:#71717a;font-size:13px;">This link is valid for 30 days from assignment.</p>`,
    available_variables: JSON.stringify([
      'employeeName',
      'formTitle',
      'organizationName',
      'dueDate',
      'fillLink',
      'assignerName',
    ]),
  },
]

async function main() {
  for (const tpl of templates) {
    const existing = await sql`SELECT id FROM email_templates WHERE slug = ${tpl.slug}`
    if (existing.length > 0) {
      console.log(`  Template '${tpl.slug}' already exists, updating...`)
      await sql`
        UPDATE email_templates SET
          name = ${tpl.name},
          description = ${tpl.description},
          subject_de = ${tpl.subject_de},
          subject_en = ${tpl.subject_en},
          body_de = ${tpl.body_de},
          body_en = ${tpl.body_en},
          available_variables = ${tpl.available_variables}::jsonb,
          updated_at = NOW()
        WHERE slug = ${tpl.slug}
      `
      console.log(`  ✓ Updated '${tpl.slug}'`)
    } else {
      await sql`
        INSERT INTO email_templates (slug, name, description, subject_de, subject_en, body_de, body_en, available_variables, is_system)
        VALUES (${tpl.slug}, ${tpl.name}, ${tpl.description}, ${tpl.subject_de}, ${tpl.subject_en}, ${tpl.body_de}, ${tpl.body_en}, ${tpl.available_variables}::jsonb, true)
      `
      console.log(`  ✓ Created '${tpl.slug}'`)
    }
  }

  console.log('\nDone.')
  await sql.end()
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message)
  await sql.end()
  process.exit(1)
})
