import { getCachedSecret } from '@/lib/crypto/secrets-cache'

/**
 * Resolve the correct n8n webhook URL based on the environment toggle
 * (test vs production) stored in integration secrets.
 */
export async function resolveWebhookUrl(): Promise<{ url: string; isTest: boolean } | null> {
  // Check unified key first, fall back to legacy per-type keys for backwards compat
  const env =
    (await getCachedSecret('n8n', 'webhook_env')) ||
    (await getCachedSecret('n8n', 'webhook_env_dossier')) ||
    (await getCachedSecret('n8n', 'webhook_env_analysis')) ||
    'production'
  const isTest = env === 'test'

  let url: string | null = null

  if (isTest) {
    url =
      (await getCachedSecret('n8n', 'webhook_url_test')) ||
      (await getCachedSecret('n8n', 'dossier_webhook_url_test')) ||
      null
  } else {
    url =
      (await getCachedSecret('n8n', 'webhook_url')) ||
      (await getCachedSecret('n8n', 'dossier_webhook_url')) ||
      process.env.N8N_WEBHOOK_URL ||
      null
  }

  if (!url) return null

  return { url, isTest }
}
