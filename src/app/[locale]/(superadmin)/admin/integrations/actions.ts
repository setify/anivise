'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import {
  setIntegrationSecret,
  getIntegrationSecret,
  getSecretMetadata,
  getAllSecretsForService,
} from '@/lib/crypto/secrets'
import { invalidateSecretCache } from '@/lib/crypto/secrets-cache'
import crypto from 'crypto'

// ─── Save Secrets ───

export async function saveIntegrationSecrets(
  service: string,
  secrets: { key: string; value: string; isSensitive: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    for (const secret of secrets) {
      if (secret.value && !secret.value.startsWith('••••')) {
        await setIntegrationSecret(
          service,
          secret.key,
          secret.value,
          secret.isSensitive,
          currentUser.id
        )
      }
    }

    // Invalidate cached secrets for this service
    invalidateSecretCache(service)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service,
        keys: secrets.map((s) => s.key),
        action: 'integration.secret_updated',
      },
    })

    revalidatePath('/admin/integrations')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save secrets' }
  }
}

// ─── Load Secrets (masked for UI) ───

export async function getIntegrationSecretsForUI(service: string) {
  await requirePlatformRole('superadmin')
  return getSecretMetadata(service)
}

// ─── Test Connections ───

export async function testSupabaseConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  const start = Date.now()
  try {
    const url =
      (await getIntegrationSecret('supabase', 'url')) ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey =
      (await getIntegrationSecret('supabase', 'service_role_key')) ||
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return { success: false, error: 'Supabase credentials not configured' }
    }

    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(10000),
    })

    const latency = Date.now() - start

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'supabase',
        action: 'integration.connection_tested',
        success: response.ok,
        latency,
      },
    })

    if (response.ok || response.status === 200) {
      return { success: true, latency }
    }
    return { success: false, latency, error: `HTTP ${response.status}` }
  } catch (err) {
    const latency = Date.now() - start
    return {
      success: false,
      latency,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function testResendConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  const start = Date.now()
  try {
    const apiKey =
      (await getIntegrationSecret('resend', 'api_key')) ||
      process.env.RESEND_API_KEY

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    // Try /domains first; if 401 with "restricted" message, the key is valid but send-only
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    })

    const latency = Date.now() - start
    let isConnected = response.ok

    if (!isConnected) {
      const body = await response.text()
      // A restricted (send-only) key returns 401 with "restricted" — key is valid
      if (response.status === 401 && body.includes('restricted')) {
        isConnected = true
      } else if (response.status === 403 && body.includes('restricted')) {
        isConnected = true
      }

      if (!isConnected) {
        await logAudit({
          actorId: currentUser.id,
          actorEmail: currentUser.email,
          action: 'settings.updated',
          entityType: 'integration_secrets',
          metadata: { service: 'resend', action: 'integration.connection_tested', success: false, latency },
        })
        return { success: false, latency, error: `HTTP ${response.status}: ${body.slice(0, 100)}` }
      }
    }

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: { service: 'resend', action: 'integration.connection_tested', success: true, latency },
    })

    return { success: true, latency }
  } catch (err) {
    const latency = Date.now() - start
    return {
      success: false,
      latency,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function testN8nConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  const start = Date.now()
  try {
    const healthUrl = await getIntegrationSecret('n8n', 'health_url')

    if (!healthUrl) {
      return {
        success: false,
        error: 'No health endpoint configured. Connection can only be tested during actual analysis.',
      }
    }

    const authHeaderName =
      (await getIntegrationSecret('n8n', 'auth_header_name')) || 'X-Anivise-Secret'
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
      signal: AbortSignal.timeout(10000),
    })

    const latency = Date.now() - start

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'n8n',
        action: 'integration.connection_tested',
        success: response.ok,
        latency,
      },
    })

    if (response.ok) {
      return { success: true, latency }
    }
    return { success: false, latency, error: `HTTP ${response.status}` }
  } catch (err) {
    const latency = Date.now() - start
    return {
      success: false,
      latency,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function sendTestEmail(): Promise<{
  success: boolean
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  try {
    const apiKey =
      (await getIntegrationSecret('resend', 'api_key')) ||
      process.env.RESEND_API_KEY
    const fromEmail =
      (await getIntegrationSecret('resend', 'from_email')) ||
      process.env.RESEND_FROM_EMAIL ||
      'noreply@anivise.com'
    const fromName =
      (await getIntegrationSecret('resend', 'from_name')) || 'Anivise'

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: currentUser.email,
      subject: '[TEST] Anivise E-Mail Integration',
      html: `<h2>Test erfolgreich!</h2><p>Diese Test-E-Mail wurde von der Anivise-Plattform gesendet.</p><p>Zeitstempel: ${new Date().toISOString()}</p>`,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'resend',
        action: 'email.test_sent',
        recipient: currentUser.email,
      },
    })

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send test email',
    }
  }
}

export async function rotateN8nSecret(): Promise<{
  success: boolean
  newSecret?: string
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const newSecret = crypto.randomBytes(32).toString('hex')

    await setIntegrationSecret('n8n', 'auth_header_value', newSecret, true, currentUser.id)
    invalidateSecretCache('n8n')

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'n8n',
        action: 'integration.secret_rotated',
      },
    })

    revalidatePath('/admin/integrations')
    return { success: true, newSecret }
  } catch {
    return { success: false, error: 'Failed to rotate secret' }
  }
}

export async function loadFromEnv(service: string): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const envMappings: Record<string, { key: string; envVar: string; sensitive: boolean }[]> = {
      supabase: [
        { key: 'url', envVar: 'NEXT_PUBLIC_SUPABASE_URL', sensitive: false },
        { key: 'anon_key', envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', sensitive: true },
        { key: 'service_role_key', envVar: 'SUPABASE_SERVICE_ROLE_KEY', sensitive: true },
      ],
      resend: [
        { key: 'api_key', envVar: 'RESEND_API_KEY', sensitive: true },
        { key: 'from_email', envVar: 'RESEND_FROM_EMAIL', sensitive: false },
      ],
      n8n: [
        { key: 'webhook_url', envVar: 'N8N_WEBHOOK_URL', sensitive: false },
        { key: 'auth_header_value', envVar: 'N8N_WEBHOOK_SECRET', sensitive: true },
      ],
    }

    const mappings = envMappings[service]
    if (!mappings) return { success: false, error: 'Unknown service' }

    let count = 0
    for (const mapping of mappings) {
      const value = process.env[mapping.envVar]
      if (value) {
        await setIntegrationSecret(
          service,
          mapping.key,
          value,
          mapping.sensitive,
          currentUser.id
        )
        count++
      }
    }

    // Invalidate cached secrets for this service
    invalidateSecretCache(service)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service,
        action: 'integration.env_imported',
        count,
      },
    })

    revalidatePath('/admin/integrations')
    return { success: true, count }
  } catch {
    return { success: false, error: 'Failed to load from env' }
  }
}

export async function testDeepgramConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  const start = Date.now()
  try {
    const apiKey = await getIntegrationSecret('deepgram', 'api_key')

    if (!apiKey) {
      return { success: false, error: 'Deepgram API key not configured' }
    }

    // Test by hitting Deepgram's /v1/listen endpoint with a minimal request
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    })

    const latency = Date.now() - start

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'deepgram',
        action: 'integration.connection_tested',
        success: response.ok,
        latency,
      },
    })

    if (response.ok) {
      return { success: true, latency }
    }
    return { success: false, latency, error: `HTTP ${response.status}` }
  } catch (err) {
    const latency = Date.now() - start
    return {
      success: false,
      latency,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function getVercelInfo() {
  await requirePlatformRole('staff')

  return {
    environment: process.env.VERCEL_ENV || null,
    region: process.env.VERCEL_REGION || null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    deploymentUrl: process.env.VERCEL_URL || null,
    isVercel: !!process.env.VERCEL,
  }
}
