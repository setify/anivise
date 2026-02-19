import { getCachedSecret } from '@/lib/crypto/secrets-cache'

/**
 * Resolve the correct n8n webhook URL for a given type based on the
 * environment toggle (test vs production) stored in integration secrets.
 */
export async function resolveWebhookUrl(
  type: 'analysis' | 'dossier'
): Promise<{ url: string; isTest: boolean } | null> {
  const envKey = `webhook_env_${type}`
  const env = (await getCachedSecret('n8n', envKey)) || 'production'
  const isTest = env === 'test'

  let url: string | null = null

  if (isTest) {
    // Load test URL
    const testKey = type === 'analysis' ? 'webhook_url_test' : 'dossier_webhook_url_test'
    url = await getCachedSecret('n8n', testKey)
  } else {
    // Load production URL
    if (type === 'analysis') {
      url =
        (await getCachedSecret('n8n', 'webhook_url')) ||
        process.env.N8N_WEBHOOK_URL ||
        null
    } else {
      url =
        (await getCachedSecret('n8n', 'dossier_webhook_url')) ||
        (await getCachedSecret('n8n', 'webhook_url')) ||
        null
    }
  }

  if (!url) return null

  return { url, isTest }
}
