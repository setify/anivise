/**
 * Deploy the Dossier AI workflow to n8n.
 *
 * Prerequisites:
 *   - n8n API URL and API key stored in integration_secrets (service=n8n, keys=api_url, api_key)
 *   - OR passed as env vars: N8N_API_URL, N8N_API_KEY
 *
 * Usage:
 *   node scripts/deploy-n8n-dossier-workflow.mjs
 *
 * After deploy, you need to manually link the OpenRouter credential
 * to the HTTP Request node in the n8n UI.
 */

import postgres from 'postgres'
import { createDecipheriv } from 'crypto'

const WORKFLOW_ID = 'Kqy6pwfw2wTu4q3FO7pEq'

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.vldtlxmplhsceyipttsi:hP9F94FIIAlfjbe9@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'

const sql = postgres(DB_URL, { ssl: 'require', max: 1 })

const AUTH_TAG_LENGTH = 16

function decryptValue(encrypted, iv, encryptionKey) {
  const keyBuffer = Buffer.from(encryptionKey, 'base64')
  const [cipherText, authTagB64] = encrypted.split('.')
  if (!cipherText || !authTagB64) {
    throw new Error('Invalid encrypted value format')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyBuffer,
    Buffer.from(iv, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH }
  )
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))

  let decrypted = decipher.update(cipherText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

async function getSecret(service, key) {
  // Try env vars first
  if (service === 'n8n' && key === 'api_url' && process.env.N8N_API_URL) {
    return process.env.N8N_API_URL
  }
  if (service === 'n8n' && key === 'api_key' && process.env.N8N_API_KEY) {
    return process.env.N8N_API_KEY
  }

  // Read from DB
  const rows = await sql`
    SELECT encrypted_value, iv, is_sensitive
    FROM integration_secrets
    WHERE service = ${service} AND key = ${key}
    LIMIT 1
  `
  if (!rows.length) return null

  const row = rows[0]

  // All values are encrypted (both sensitive and non-sensitive)
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY
  if (!encryptionKey) {
    console.warn(`Cannot decrypt ${service}/${key}: SECRETS_ENCRYPTION_KEY not set`)
    return null
  }

  return decryptValue(row.encrypted_value, row.iv, encryptionKey)
}

function buildWorkflow(authHeaderValue = '') {
  return {
    name: 'Anivise Dossier Pipeline',
    nodes: [
      // 1. Webhook Trigger — receives POST from Anivise platform
      {
        parameters: {
          httpMethod: 'POST',
          path: 'dossier-trigger',
          responseMode: 'responseNode',
          options: {},
        },
        id: 'webhook-trigger',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        webhookId: 'dossier-trigger',
      },
      // 2. Build Prompt — assembles systemPrompt + userMessage from payload data
      {
        parameters: {
          jsCode: `const body = $input.first().json;

// Build data context from all sources
let dataContext = '';

// Subject info
if (body.subject) {
  dataContext += '## Person\\n';
  dataContext += \\\`Name: \\\${body.subject.name}\\n\\\`;
  if (body.subject.position) dataContext += \\\`Position: \\\${body.subject.position}\\n\\\`;
  if (body.subject.department) dataContext += \\\`Abteilung: \\\${body.subject.department}\\n\\\`;
  if (body.subject.location) dataContext += \\\`Standort: \\\${body.subject.location}\\n\\\`;
  dataContext += '\\n';
}

// Transcripts
if (body.transcripts && body.transcripts.length > 0) {
  dataContext += '## Transkripte\\n';
  for (const t of body.transcripts) {
    dataContext += \\\`### Aufnahme (\\\${t.language})\\n\\\${t.text}\\n\\n\\\`;
  }
}

// Documents
if (body.documents && body.documents.length > 0) {
  dataContext += '## Dokumente\\n';
  for (const d of body.documents) {
    dataContext += \\\`### \\\${d.name}\\n\\\${d.text}\\n\\n\\\`;
  }
}

// Form responses
if (body.formResponses && body.formResponses.length > 0) {
  dataContext += '## Formular-Antworten\\n';
  for (const f of body.formResponses) {
    dataContext += \\\`### \\\${f.formTitle}\\n\\\${JSON.stringify(f.data, null, 2)}\\n\\n\\\`;
  }
}

// System prompt = the instructions from the platform
const systemPrompt = body.prompt;

// User message = the actual data to analyze
const userMessage = dataContext || 'Keine Daten vorhanden.';

return [{
  json: {
    dossierId: body.dossierId,
    analysisId: body.analysisId,
    organizationId: body.organizationId,
    callbackUrl: body.callbackUrl,
    systemPrompt,
    userMessage,
  }
}];`,
        },
        id: 'build-prompt',
        name: 'Build Prompt',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [470, 300],
      },
      // 3. AI Agent — uses the OpenRouter Chat Model (credential already linked)
      {
        parameters: {
          promptType: 'define',
          text: '={{ $json.userMessage }}',
          options: {
            systemMessage: '={{ $json.systemPrompt }}',
          },
        },
        id: 'a30aaaeb-6fac-4fa4-9278-c7a442556b02',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 3.1,
        position: [690, 300],
      },
      // 4. OpenRouter Chat Model — sub-node providing the LLM to the AI Agent
      {
        parameters: {
          model: 'anthropic/claude-3.5-haiku',
          options: {},
        },
        id: '296f20d9-2d7c-4280-939f-0ae4ab5783e7',
        name: 'OpenRouter Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
        typeVersion: 1,
        position: [760, 520],
        credentials: {
          openRouterApi: {
            id: 'O8V8DRUBZ48td8Ia',
            name: '[Setify] OpenRouter',
          },
        },
      },
      // 5. Parse Response — extracts AI Agent output and prepares callback payload
      {
        parameters: {
          jsCode: `const input = $input.first().json;
const prev = $('Build Prompt').first().json;

let resultData = {};
let modelUsed = 'anthropic/claude-3.5-haiku';
let tokenUsage = { prompt_tokens: 0, completion_tokens: 0 };
let status = 'completed';
let errorMessage = '';

try {
  // AI Agent returns output in the 'output' field
  const content = input.output || '';

  // Try to parse as JSON (the prompt asks for JSON format)
  // First try direct parse
  try {
    resultData = JSON.parse(content);
  } catch {
    // Maybe the AI wrapped it in markdown code block
    const jsonMatch = content.match(/\\\`\\\`\\\`json?\\n?([\\s\\S]*?)\\\`\\\`\\\`/);
    if (jsonMatch) {
      resultData = JSON.parse(jsonMatch[1].trim());
    } else {
      // Last resort: treat the whole output as summary
      resultData = { summary: content, confidence: 0.5 };
    }
  }

  // Extract token usage if available from AI Agent metadata
  if (input.tokenUsage) {
    tokenUsage = {
      prompt_tokens: input.tokenUsage.inputTokens || input.tokenUsage.prompt_tokens || 0,
      completion_tokens: input.tokenUsage.outputTokens || input.tokenUsage.completion_tokens || 0,
    };
  }
} catch (err) {
  status = 'failed';
  errorMessage = 'Failed to parse AI response: ' + err.message;
}

return [{
  json: {
    dossierId: prev.dossierId,
    organizationId: prev.organizationId,
    callbackUrl: prev.callbackUrl,
    status,
    resultData,
    modelUsed,
    tokenUsage,
    errorMessage: errorMessage || undefined,
  }
}];`,
        },
        id: 'parse-response',
        name: 'Parse Response',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [910, 300],
      },
      // 6. Callback to Anivise — sends result back to the platform
      {
        parameters: {
          method: 'POST',
          url: '={{ $json.callbackUrl }}',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'X-Anivise-Secret',
                value: authHeaderValue,
              },
              {
                name: 'Content-Type',
                value: 'application/json',
              },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "dossierId": {{ JSON.stringify($json.dossierId) }},
  "organizationId": {{ JSON.stringify($json.organizationId) }},
  "status": {{ JSON.stringify($json.status) }},
  "resultData": {{ JSON.stringify($json.resultData) }},
  "modelUsed": {{ JSON.stringify($json.modelUsed) }},
  "tokenUsage": {{ JSON.stringify($json.tokenUsage) }},
  "errorMessage": {{ JSON.stringify($json.errorMessage) }}
}`,
          options: {
            timeout: 30000,
          },
        },
        id: 'callback',
        name: 'Callback to Anivise',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1130, 300],
      },
      // 7. Respond to Webhook — immediate 200 response to the platform
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={ "success": true, "message": "Dossier request received" }',
          options: {},
        },
        id: 'respond-webhook',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [470, 520],
      },
    ],
    connections: {
      'Webhook Trigger': {
        main: [
          [
            { node: 'Build Prompt', type: 'main', index: 0 },
            { node: 'Respond to Webhook', type: 'main', index: 0 },
          ],
        ],
      },
      'Build Prompt': {
        main: [[{ node: 'AI Agent', type: 'main', index: 0 }]],
      },
      'AI Agent': {
        main: [[{ node: 'Parse Response', type: 'main', index: 0 }]],
      },
      'Parse Response': {
        main: [[{ node: 'Callback to Anivise', type: 'main', index: 0 }]],
      },
      'OpenRouter Chat Model': {
        ai_languageModel: [
          [{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }],
        ],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
  }
}

async function main() {
  console.log('Deploying n8n Dossier Workflow...\n')

  const apiUrl = await getSecret('n8n', 'api_url')
  const apiKey = await getSecret('n8n', 'api_key')
  const authHeaderValue = await getSecret('n8n', 'auth_header_value')

  if (!apiUrl || !apiKey) {
    console.error('Error: n8n API URL and API key are required.')
    console.error('Set them in the admin integrations page or via N8N_API_URL / N8N_API_KEY env vars.')
    process.exit(1)
  }

  if (!authHeaderValue) {
    console.warn('Warning: n8n auth_header_value not set. Deploying without webhook authentication.')
    console.warn('Set it in Admin → Integrations → n8n → Auth Header Value to secure the webhook.\n')
  }

  const workflow = buildWorkflow(authHeaderValue)

  // Try to update existing workflow
  console.log(`Updating workflow ${WORKFLOW_ID}...`)
  const updateResp = await fetch(`${apiUrl}/api/v1/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
    body: JSON.stringify(workflow),
  })

  if (updateResp.ok) {
    const data = await updateResp.json()
    console.log(`Workflow updated: ${data.name} (ID: ${data.id})`)
  } else if (updateResp.status === 404) {
    // Create new workflow
    console.log('Workflow not found, creating new...')
    const createResp = await fetch(`${apiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
      body: JSON.stringify(workflow),
    })

    if (!createResp.ok) {
      const err = await createResp.text()
      console.error(`Failed to create workflow: ${createResp.status} ${err}`)
      process.exit(1)
    }

    const data = await createResp.json()
    console.log(`Workflow created: ${data.name} (ID: ${data.id})`)
  } else {
    const err = await updateResp.text()
    console.error(`Failed to update workflow: ${updateResp.status} ${err}`)
    process.exit(1)
  }

  // Activate workflow
  console.log('Activating workflow...')
  const activateResp = await fetch(`${apiUrl}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
    },
  })

  if (activateResp.ok) {
    console.log('Workflow activated.')
  } else {
    console.warn(`Warning: Could not activate workflow (${activateResp.status}). Activate manually in n8n UI.`)
  }

  // Get webhook URL
  const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '')
  const webhookUrl = `${baseUrl}/webhook/dossier-trigger`
  console.log(`\nDossier Webhook URL: ${webhookUrl}`)
  console.log('OpenRouter credential [Setify] OpenRouter is already linked to the AI Agent.')

  await sql.end()
}

main().catch(async (err) => {
  console.error('Deploy failed:', err.message)
  await sql.end()
  process.exit(1)
})
