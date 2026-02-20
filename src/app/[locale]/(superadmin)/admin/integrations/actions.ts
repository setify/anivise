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
import { invalidateSecretCache, getCachedSecret } from '@/lib/crypto/secrets-cache'
import { resolveWebhookUrl } from '@/lib/n8n/resolve-webhook-url'
import { db } from '@/lib/db'
import { analysisJobs, analysisDossiers, reports } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
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

export async function testN8nApiConnection(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const currentUser = await requirePlatformRole('superadmin')

  const start = Date.now()
  try {
    const apiUrl = await getIntegrationSecret('n8n', 'api_url')
    const apiKey = await getIntegrationSecret('n8n', 'api_key')

    if (!apiUrl || !apiKey) {
      return { success: false, error: 'n8n API URL or API Key not configured' }
    }

    const baseUrl = apiUrl.replace(/\/+$/, '')
    const response = await fetch(`${baseUrl}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': apiKey },
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
        action: 'integration.api_tested',
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
        { key: 'api_url', envVar: 'N8N_API_URL', sensitive: false },
        { key: 'api_key', envVar: 'N8N_API_KEY', sensitive: true },
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

// ─── Webhook Environment Toggle ───

export async function setWebhookEnvironment(
  env: 'test' | 'production'
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await setIntegrationSecret('n8n', 'webhook_env', env, false, currentUser.id)
    invalidateSecretCache('n8n')

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'n8n',
        action: 'integration.webhook_env_changed',
        environment: env,
      },
    })

    revalidatePath('/admin/integrations')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to set webhook environment' }
  }
}

// ─── Dry Run Webhook ───

export async function dryRunWebhook(): Promise<{
  success: boolean
  statusCode?: number
  responseBody?: string
  url?: string
  isTest?: boolean
  error?: string
}> {
  try {
    await requirePlatformRole('superadmin')

    const resolved = await resolveWebhookUrl()
    if (!resolved) {
      return { success: false, error: 'No webhook URL configured for this environment' }
    }

    const authHeaderName =
      (await getCachedSecret('n8n', 'auth_header_name')) || 'X-Anivise-Secret'
    const authHeaderValue =
      (await getCachedSecret('n8n', 'auth_header_value')) ||
      process.env.N8N_WEBHOOK_SECRET

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeaderValue) {
      headers[authHeaderName] = authHeaderValue
    }

    const dummyPayload = {
      dossierId: '00000000-0000-0000-0000-000000000000',
      analysisId: '00000000-0000-0000-0000-000000000000',
      organizationId: '00000000-0000-0000-0000-000000000000',
      callbackUrl: 'https://example.com/dry-run-callback',
      subject: { name: 'Dry Run Test' },
      transcripts: [],
      documents: [],
      formResponses: [],
      prompt: 'Dry run test — please ignore.',
    }

    const response = await fetch(resolved.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(dummyPayload),
      signal: AbortSignal.timeout(15000),
    })

    const body = await response.text()

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: body.slice(0, 500),
      url: resolved.url,
      isTest: resolved.isTest,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Dry run failed',
    }
  }
}

// ─── Cleanup Test Data ───

export async function cleanupTestData(): Promise<{
  success: boolean
  deletedDossiers?: number
  deletedJobs?: number
  deletedReports?: number
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Delete reports linked to test jobs
    const testJobIds = db
      .select({ id: analysisJobs.id })
      .from(analysisJobs)
      .where(eq(analysisJobs.isTest, true))

    const deletedReportsResult = await db
      .delete(reports)
      .where(inArray(reports.analysisJobId, testJobIds))
      .returning({ id: reports.id })

    // Delete test dossiers
    const deletedDossiersResult = await db
      .delete(analysisDossiers)
      .where(eq(analysisDossiers.isTest, true))
      .returning({ id: analysisDossiers.id })

    // Delete test jobs
    const deletedJobsResult = await db
      .delete(analysisJobs)
      .where(eq(analysisJobs.isTest, true))
      .returning({ id: analysisJobs.id })

    const deletedReports = deletedReportsResult.length
    const deletedDossiers = deletedDossiersResult.length
    const deletedJobs = deletedJobsResult.length

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'integration_secrets',
      metadata: {
        service: 'n8n',
        action: 'integration.test_data_cleaned',
        deletedReports,
        deletedDossiers,
        deletedJobs,
      },
    })

    revalidatePath('/admin/integrations')
    return { success: true, deletedDossiers, deletedJobs, deletedReports }
  } catch {
    return { success: false, error: 'Failed to cleanup test data' }
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
