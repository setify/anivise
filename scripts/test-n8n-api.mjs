import crypto from 'crypto'
import postgres from 'postgres'

const DB_URL = 'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'
const ENCRYPTION_KEY = '8waoXJKmGQk0a6U1iPLXQZMfXMSZsKn/BOGT0kqUdUE='

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

function decrypt(encrypted, ivBase64) {
  const key = Buffer.from(ENCRYPTION_KEY, 'base64')
  const iv = Buffer.from(ivBase64, 'base64')
  const [cipherText, authTagB64] = encrypted.split('.')
  if (!cipherText || !authTagB64) throw new Error('Invalid encrypted format')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  let dec = decipher.update(cipherText, 'base64', 'utf8')
  dec += decipher.final('utf8')
  return dec
}

async function main() {
  const rows = await sql`SELECT key, encrypted_value, iv FROM integration_secrets WHERE service = 'n8n' AND key IN ('api_url', 'api_key')`

  let apiUrl, apiKey
  for (const r of rows) {
    const val = decrypt(r.encrypted_value, r.iv)
    if (r.key === 'api_url') apiUrl = val
    if (r.key === 'api_key') apiKey = val
  }

  if (!apiUrl || !apiKey) {
    console.log('Missing api_url or api_key in integration_secrets')
    console.log('Found keys:', rows.map(r => r.key).join(', ') || 'none')
    await sql.end()
    return
  }

  console.log('API URL:', apiUrl)
  console.log('API Key:', apiKey.slice(0, 8) + '...' + apiKey.slice(-4))
  console.log('')

  const base = apiUrl.replace(/\/+$/, '')
  const start = Date.now()
  const resp = await fetch(base + '/api/v1/workflows?limit=10', {
    headers: { 'X-N8N-API-KEY': apiKey },
    signal: AbortSignal.timeout(10000),
  })
  const latency = Date.now() - start

  console.log('Status:', resp.status, resp.statusText)
  console.log('Latency:', latency + 'ms')

  if (resp.ok) {
    const data = await resp.json()
    const workflows = data.data || []
    console.log('Workflows found:', workflows.length)
    if (workflows.length > 0) {
      for (const wf of workflows) {
        console.log(`  - ${wf.name} (id: ${wf.id}, active: ${wf.active})`)
      }
    } else {
      console.log('  (no workflows yet)')
    }
  } else {
    const body = await resp.text()
    console.log('Error:', body.slice(0, 300))
  }

  await sql.end()
}

main().catch(async (err) => {
  console.error('Failed:', err.message)
  await sql.end()
  process.exit(1)
})
