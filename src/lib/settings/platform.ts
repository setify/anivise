import { db } from '@/lib/db'
import { platformSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export interface PlatformSettings {
  'platform.name': string
  'platform.default_locale': 'de' | 'en'
  'platform.default_org_tier': 'individual' | 'team' | 'enterprise'
  'invitation.expiry_days': number
  'invitation.max_resends': number
  'org.reserved_slugs': string[]
  'org.max_members_trial': number
  'analysis.max_transcript_size_mb': number
  'analysis.n8n_webhook_url': string
}

const DEFAULTS: PlatformSettings = {
  'platform.name': 'Anivise',
  'platform.default_locale': 'de',
  'platform.default_org_tier': 'team',
  'invitation.expiry_days': 7,
  'invitation.max_resends': 3,
  'org.reserved_slugs': [
    'admin',
    'api',
    'www',
    'app',
    'auth',
    'invite',
    'login',
    'register',
  ],
  'org.max_members_trial': 5,
  'analysis.max_transcript_size_mb': 10,
  'analysis.n8n_webhook_url': process.env.N8N_WEBHOOK_URL || '',
}

export function getDefault<K extends keyof PlatformSettings>(
  key: K
): PlatformSettings[K] {
  return DEFAULTS[key]
}

export async function getSetting<K extends keyof PlatformSettings>(
  key: K
): Promise<PlatformSettings[K]> {
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1)

  if (!row) return DEFAULTS[key]
  return row.value as PlatformSettings[K]
}

export async function setSetting<K extends keyof PlatformSettings>(
  key: K,
  value: PlatformSettings[K],
  actorId: string
): Promise<void> {
  const existing = await db
    .select({ id: platformSettings.id })
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(platformSettings)
      .set({
        value: value as unknown as Record<string, unknown>,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, key))
  } else {
    await db.insert(platformSettings).values({
      key,
      value: value as unknown as Record<string, unknown>,
      description: null,
      updatedBy: actorId,
    })
  }
}

export async function getAllSettings(): Promise<Partial<PlatformSettings>> {
  const rows = await db.select().from(platformSettings)

  const result: Partial<PlatformSettings> = {}
  for (const row of rows) {
    const key = row.key as keyof PlatformSettings
    if (key in DEFAULTS) {
      ;(result as Record<string, unknown>)[key] = row.value
    }
  }

  // Fill in defaults for missing keys
  for (const key of Object.keys(DEFAULTS) as (keyof PlatformSettings)[]) {
    if (!(key in result)) {
      ;(result as Record<string, unknown>)[key] = DEFAULTS[key]
    }
  }

  return result
}
