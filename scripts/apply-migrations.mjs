import postgres from 'postgres'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

function getMigrationHash(tag) {
  const content = readFileSync(join(ROOT, 'drizzle/migrations', `${tag}.sql`), 'utf-8')
  return createHash('sha256').update(content).digest('hex')
}

async function main() {
  // Migrations already applied to DB (schema existed before migration tracking was set up)
  const alreadyApplied = [
    '0000_military_stranger',
    '0001_yellow_leech',
    '0002_rich_zuras',
  ]

  // New migrations to apply
  const toApply = [
    '0003_whole_the_call',
    '0004_cheerful_mister_fear',
    '0005_supreme_scalphunter',
    '0006_lean_legion',
    '0007_public_killer_shrike',
    '0008_big_donald_blake',
    '0009_supreme_hitman',
    '0010_superb_eternity',
    '0011_luxuriant_makkari',
  ]

  console.log('Ensuring drizzle migrations schema and table exist...')
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `

  // Mark already-applied migrations in tracking table
  for (const tag of alreadyApplied) {
    const hash = getMigrationHash(tag)
    const existing = await sql`SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`
    if (existing.length === 0) {
      await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`
      console.log(`✓ Marked ${tag} as already applied`)
    } else {
      console.log(`  ${tag} already tracked, skipping`)
    }
  }

  // Apply new migrations
  for (const tag of toApply) {
    const hash = getMigrationHash(tag)
    const existing = await sql`SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`

    if (existing.length > 0) {
      console.log(`  ${tag} already applied, skipping`)
      continue
    }

    const content = readFileSync(join(ROOT, 'drizzle/migrations', `${tag}.sql`), 'utf-8')
    const statements = content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)

    console.log(`Applying ${tag} (${statements.length} statements)...`)
    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt)
      }
      await tx`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`
    })
    console.log(`✓ Applied ${tag}`)
  }

  console.log('\nAll migrations up to date.')
  await sql.end()
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message)
  await sql.end()
  process.exit(1)
})
