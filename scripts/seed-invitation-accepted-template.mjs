import postgres from 'postgres'

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

const template = {
  slug: 'invitation-accepted',
  name: 'Invitation Accepted',
  description: 'Sent to the inviter when their invitation is accepted by the invitee.',
  subject_de: 'Einladung angenommen',
  subject_en: 'Invitation Accepted',
  body_de: `<h2 style="margin-top:0;">Einladung angenommen</h2><p><strong>{{acceptorName}}</strong> ({{acceptorEmail}}) hat die Einladung angenommen und ist nun als <strong>{{role}}</strong> beigetreten.</p><p>{{orgLine}}</p>`,
  body_en: `<h2 style="margin-top:0;">Invitation Accepted</h2><p><strong>{{acceptorName}}</strong> ({{acceptorEmail}}) has accepted the invitation and joined as <strong>{{role}}</strong>.</p><p>{{orgLine}}</p>`,
  available_variables: JSON.stringify(['acceptorName', 'acceptorEmail', 'role', 'orgName', 'orgLine']),
}

async function main() {
  const existing = await sql`SELECT id FROM email_templates WHERE slug = ${template.slug}`
  if (existing.length > 0) {
    console.log(`  ${template.slug} already exists, skipping`)
  } else {
    await sql`
      INSERT INTO email_templates (slug, name, description, subject_de, subject_en, body_de, body_en, available_variables, is_system)
      VALUES (${template.slug}, ${template.name}, ${template.description}, ${template.subject_de}, ${template.subject_en}, ${template.body_de}, ${template.body_en}, ${template.available_variables}::jsonb, true)
    `
    console.log(`✓ Seeded ${template.slug}`)
  }

  console.log('\nDone.')
  await sql.end()
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message)
  await sql.end()
  process.exit(1)
})
