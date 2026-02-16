import { getCachedSecret } from '@/lib/crypto/secrets-cache'

export interface N8nTriggerPayload {
  jobId: string
  organizationId: string
  fileUrl: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export interface N8nHealthStatus {
  connected: boolean
  url: string | null
  responseTime: number | null
  error: string | null
  checkedAt: Date
}

/**
 * Trigger an analysis job via n8n webhook
 */
export async function triggerN8nWebhook(
  payload: N8nTriggerPayload
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl =
    (await getCachedSecret('n8n', 'webhook_url')) ||
    process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return { success: false, error: 'n8n webhook URL not configured' }
  }

  const authHeaderName =
    (await getCachedSecret('n8n', 'auth_header_name')) || 'X-Anivise-Secret'
  const authHeaderValue =
    (await getCachedSecret('n8n', 'auth_header_value')) ||
    process.env.N8N_WEBHOOK_SECRET

  if (!authHeaderValue) {
    return { success: false, error: 'n8n auth secret not configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [authHeaderName]: authHeaderValue,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `n8n responded with status ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Failed to reach n8n: ${message}` }
  }
}

/**
 * Check n8n health by pinging the webhook URL
 */
export async function checkN8nHealth(): Promise<N8nHealthStatus> {
  const webhookUrl =
    (await getCachedSecret('n8n', 'webhook_url')) ||
    process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      connected: false,
      url: null,
      responseTime: null,
      error: 'Webhook URL not configured',
      checkedAt: new Date(),
    }
  }

  const start = Date.now()

  try {
    const urlObj = new URL(webhookUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    })

    const responseTime = Date.now() - start

    return {
      connected: response.ok || response.status < 500,
      url: webhookUrl,
      responseTime,
      error: response.ok ? null : `Status ${response.status}`,
      checkedAt: new Date(),
    }
  } catch (error) {
    const responseTime = Date.now() - start
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      connected: false,
      url: webhookUrl,
      responseTime,
      error: message,
      checkedAt: new Date(),
    }
  }
}
