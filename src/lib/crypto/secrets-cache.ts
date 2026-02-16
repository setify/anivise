import { getIntegrationSecret } from './secrets'

const cache = new Map<string, { value: string; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get an integration secret with in-memory caching (5-minute TTL).
 * Falls back to the uncached getIntegrationSecret on cache miss.
 */
export async function getCachedSecret(
  service: string,
  key: string
): Promise<string | null> {
  const cacheKey = `${service}:${key}`
  const cached = cache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const value = await getIntegrationSecret(service, key)
  if (value) {
    cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL })
  } else {
    // Remove stale cache entry if secret was deleted
    cache.delete(cacheKey)
  }

  return value
}

/**
 * Invalidate cached secrets for a service. If key is provided,
 * only that specific secret is invalidated. Otherwise all secrets
 * for the service are invalidated.
 */
export function invalidateSecretCache(service: string, key?: string): void {
  if (key) {
    cache.delete(`${service}:${key}`)
  } else {
    for (const cacheKey of cache.keys()) {
      if (cacheKey.startsWith(`${service}:`)) {
        cache.delete(cacheKey)
      }
    }
  }
}

/**
 * Invalidate all cached secrets.
 */
export function invalidateAllSecretCaches(): void {
  cache.clear()
}
