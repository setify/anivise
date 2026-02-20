import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')

// Same DB URL as apply-migrations.mjs
const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

// SQL files to apply in order
const migrationFiles = [
  'supabase/migrations/001_enable_rls.sql',
  'supabase/migrations/002_tenant_isolation_policies.sql',
  'supabase/migrations/003_storage_rls_policies.sql',
]

/**
 * Split a SQL file into individual statements.
 * Handles multi-line statements like CREATE FUNCTION with $$ delimiters.
 */
function splitStatements(content) {
  const statements = []
  let current = ''
  let inDollarQuote = false

  const lines = content.split('\n')
  for (const line of lines) {
    // Skip pure comment lines when not inside a statement
    if (!current.trim() && line.trim().startsWith('--')) {
      continue
    }

    current += line + '\n'

    // Track $$ dollar quoting (used in CREATE FUNCTION bodies)
    const dollarMatches = line.match(/\$\$/g)
    if (dollarMatches) {
      for (const _match of dollarMatches) {
        inDollarQuote = !inDollarQuote
      }
    }

    // If we're not inside a dollar-quoted block and the line ends with ;
    if (!inDollarQuote && line.trimEnd().endsWith(';')) {
      const stmt = current.trim()
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  // Handle any remaining content
  const remaining = current.trim()
  if (remaining && !remaining.startsWith('--')) {
    statements.push(remaining)
  }

  return statements
}

/**
 * Extract a short description from a SQL statement for logging
 */
function describeStatement(stmt) {
  const firstLine = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--'))?.trim() || ''
  if (firstLine.length > 100) {
    return firstLine.substring(0, 100) + '...'
  }
  return firstLine
}

async function main() {
  console.log('=== Applying Supabase RLS Migrations ===\n')

  let totalSuccess = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const file of migrationFiles) {
    const filePath = join(ROOT, file)
    console.log(`\n--- ${file} ---`)

    let content
    try {
      content = readFileSync(filePath, 'utf-8')
    } catch (err) {
      console.error(`  FAILED to read file: ${err.message}`)
      totalFailed++
      continue
    }

    const statements = splitStatements(content)
    console.log(`  Found ${statements.length} statement(s)\n`)

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const desc = describeStatement(stmt)

      try {
        await sql.unsafe(stmt)
        console.log(`  [${i + 1}/${statements.length}] OK: ${desc}`)
        totalSuccess++
      } catch (err) {
        const msg = err.message || String(err)

        // Check if the error is because the policy/object already exists
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate key value') ||
          msg.includes('already enabled')
        ) {
          console.log(`  [${i + 1}/${statements.length}] SKIPPED (already exists): ${desc}`)
          totalSkipped++
        } else {
          console.error(`  [${i + 1}/${statements.length}] FAILED: ${desc}`)
          console.error(`    Error: ${msg}`)
          totalFailed++
        }
      }
    }
  }

  console.log('\n=== Summary ===')
  console.log(`  Successful: ${totalSuccess}`)
  console.log(`  Skipped (already exist): ${totalSkipped}`)
  console.log(`  Failed: ${totalFailed}`)

  if (totalFailed > 0) {
    console.log('\nSome statements failed. Review errors above.')
  } else {
    console.log('\nAll RLS migrations applied successfully!')
  }

  await sql.end()
}

main().catch(async (err) => {
  console.error('Script failed:', err.message)
  await sql.end()
  process.exit(1)
})
