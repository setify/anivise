'use server'

import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getIntegrationSecret } from '@/lib/crypto/secrets'

interface HealthResult {
  service: string
  status: 'connected' | 'error' | 'not_configured'
  latency?: number
  error?: string
}

async function checkSupabase(): Promise<HealthResult> {
  const start = Date.now()
  try {
    const url =
      (await getIntegrationSecret('supabase', 'url')) ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey =
      (await getIntegrationSecret('supabase', 'service_role_key')) ||
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return { service: 'supabase', status: 'not_configured' }
    }

    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(5000),
    })

    const latency = Date.now() - start
    if (response.ok || response.status === 200) {
      return { service: 'supabase', status: 'connected', latency }
    }
    return {
      service: 'supabase',
      status: 'error',
      latency,
      error: `HTTP ${response.status}`,
    }
  } catch (err) {
    return {
      service: 'supabase',
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

async function checkResend(): Promise<HealthResult> {
  const start = Date.now()
  try {
    const apiKey =
      (await getIntegrationSecret('resend', 'api_key')) ||
      process.env.RESEND_API_KEY

    if (!apiKey) {
      return { service: 'resend', status: 'not_configured' }
    }

    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })

    const latency = Date.now() - start
    if (response.ok) {
      return { service: 'resend', status: 'connected', latency }
    }

    // A restricted (send-only) key returns 401/403 with "restricted" — key is valid
    const body = await response.text()
    if (
      (response.status === 401 || response.status === 403) &&
      body.includes('restricted')
    ) {
      return { service: 'resend', status: 'connected', latency }
    }

    return {
      service: 'resend',
      status: 'error',
      latency,
      error: `HTTP ${response.status}`,
    }
  } catch (err) {
    return {
      service: 'resend',
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

async function checkN8n(): Promise<HealthResult> {
  const start = Date.now()
  try {
    const healthUrl = await getIntegrationSecret('n8n', 'health_url')

    if (!healthUrl) {
      // Try API as fallback
      const apiUrl = await getIntegrationSecret('n8n', 'api_url')
      const apiKey = await getIntegrationSecret('n8n', 'api_key')

      if (!apiUrl || !apiKey) {
        return { service: 'n8n', status: 'not_configured' }
      }

      const baseUrl = apiUrl.replace(/\/+$/, '')
      const response = await fetch(`${baseUrl}/api/v1/workflows?limit=1`, {
        headers: { 'X-N8N-API-KEY': apiKey },
        signal: AbortSignal.timeout(5000),
      })

      const latency = Date.now() - start
      if (response.ok) {
        return { service: 'n8n', status: 'connected', latency }
      }
      return {
        service: 'n8n',
        status: 'error',
        latency,
        error: `HTTP ${response.status}`,
      }
    }

    const authHeaderName =
      (await getIntegrationSecret('n8n', 'auth_header_name')) ||
      'X-Anivise-Secret'
    const authHeaderValue =
      (await getIntegrationSecret('n8n', 'auth_header_value')) ||
      process.env.N8N_WEBHOOK_SECRET

    const headers: Record<string, string> = {}
    if (authHeaderValue) {
      headers[authHeaderName] = authHeaderValue
    }

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    })

    const latency = Date.now() - start
    if (response.ok) {
      return { service: 'n8n', status: 'connected', latency }
    }
    return {
      service: 'n8n',
      status: 'error',
      latency,
      error: `HTTP ${response.status}`,
    }
  } catch (err) {
    return {
      service: 'n8n',
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

async function checkDeepgram(): Promise<HealthResult> {
  const start = Date.now()
  try {
    const apiKey = await getIntegrationSecret('deepgram', 'api_key')

    if (!apiKey) {
      return { service: 'deepgram', status: 'not_configured' }
    }

    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })

    const latency = Date.now() - start
    if (response.ok) {
      return { service: 'deepgram', status: 'connected', latency }
    }
    return {
      service: 'deepgram',
      status: 'error',
      latency,
      error: `HTTP ${response.status}`,
    }
  } catch (err) {
    return {
      service: 'deepgram',
      status: 'error',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function getSystemHealth(): Promise<HealthResult[]> {
  await requirePlatformRole('staff')

  const results = await Promise.allSettled([
    checkSupabase(),
    checkResend(),
    checkN8n(),
    checkDeepgram(),
  ])

  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          service: 'unknown',
          status: 'error' as const,
          error: r.reason?.message || 'Check failed',
        }
  )
}
