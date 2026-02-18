import { db } from '@/lib/db'
import { platformSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export interface PlatformSettings {
  'platform.name': string
  'platform.logo_url': string
  'platform.default_locale': 'de' | 'en'
  'platform.default_product_id': string
  'invitation.expiry_days': number
  'invitation.max_resends': number
  'org.reserved_slugs': string[]
  'analysis.max_transcript_size_mb': number
  'contact.upgrade_email': string
  'email.logo_url': string
  'email.logo_link': string
  'email.bg_color': string
  'email.content_bg_color': string
  'email.primary_color': string
  'email.text_color': string
  'email.link_color': string
  'email.footer_text_de': string
  'email.footer_text_en': string
  'email.border_radius': number
  'email.support_email': string
}

export const EMAIL_LAYOUT_DEFAULTS = {
  'email.logo_url': '',
  'email.logo_link': '',
  'email.bg_color': '#f4f4f5',
  'email.content_bg_color': '#ffffff',
  'email.primary_color': '#4f46e5',
  'email.text_color': '#18181b',
  'email.link_color': '#4f46e5',
  'email.footer_text_de':
    'Diese E-Mail wurde von der {{platformName}}-Plattform gesendet.',
  'email.footer_text_en':
    'This email was sent by the {{platformName}} platform.',
  'email.border_radius': 12,
  'email.support_email': '',
} as const

const DEFAULTS: PlatformSettings = {
  'platform.name': 'Anivise',
  'platform.logo_url': '',
  'platform.default_locale': 'de',
  'platform.default_product_id': '',
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
  'analysis.max_transcript_size_mb': 10,
  'contact.upgrade_email': '',
  ...EMAIL_LAYOUT_DEFAULTS,
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
