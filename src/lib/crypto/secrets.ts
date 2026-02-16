import crypto from 'crypto'
import { db } from '@/lib/db'
import { integrationSecrets } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.SECRETS_ENCRYPTION_KEY
  if (!key) {
    throw new Error('SECRETS_ENCRYPTION_KEY environment variable is not set')
  }
  return Buffer.from(key, 'base64')
}

export function encryptSecret(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  // Append auth tag to encrypted data
  return {
    encrypted: encrypted + '.' + authTag.toString('base64'),
    iv: iv.toString('base64'),
  }
}

export function decryptSecret(encrypted: string, iv: string): string {
  const key = getEncryptionKey()
  const [cipherText, authTagB64] = encrypted.split('.')
  if (!cipherText || !authTagB64) {
    throw new Error('Invalid encrypted value format')
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH }
  )
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))

  let decrypted = decipher.update(cipherText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function getIntegrationSecret(
  service: string,
  key: string
): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        encryptedValue: integrationSecrets.encryptedValue,
        iv: integrationSecrets.iv,
      })
      .from(integrationSecrets)
      .where(
        and(
          eq(integrationSecrets.service, service),
          eq(integrationSecrets.key, key)
        )
      )
      .limit(1)

    if (!row) return null
    return decryptSecret(row.encryptedValue, row.iv)
  } catch {
    return null
  }
}

export async function setIntegrationSecret(
  service: string,
  key: string,
  value: string,
  isSensitive: boolean,
  actorId: string
): Promise<void> {
  const { encrypted, iv } = encryptSecret(value)

  const [existing] = await db
    .select({ id: integrationSecrets.id })
    .from(integrationSecrets)
    .where(
      and(
        eq(integrationSecrets.service, service),
        eq(integrationSecrets.key, key)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(integrationSecrets)
      .set({
        encryptedValue: encrypted,
        iv,
        isSensitive,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(integrationSecrets.id, existing.id))
  } else {
    await db.insert(integrationSecrets).values({
      service,
      key,
      encryptedValue: encrypted,
      iv,
      isSensitive,
      updatedBy: actorId,
    })
  }
}

export async function getAllSecretsForService(
  service: string
): Promise<Record<string, string>> {
  const rows = await db
    .select({
      key: integrationSecrets.key,
      encryptedValue: integrationSecrets.encryptedValue,
      iv: integrationSecrets.iv,
    })
    .from(integrationSecrets)
    .where(eq(integrationSecrets.service, service))

  const result: Record<string, string> = {}
  for (const row of rows) {
    try {
      result[row.key] = decryptSecret(row.encryptedValue, row.iv)
    } catch {
      // Skip corrupted entries
    }
  }
  return result
}

export async function getMaskedSecret(
  service: string,
  key: string
): Promise<string | null> {
  const value = await getIntegrationSecret(service, key)
  if (!value) return null
  if (value.length <= 4) return '••••'
  return '••••••••••••' + value.slice(-4)
}

export async function getSecretMetadata(service: string): Promise<
  {
    key: string
    isSensitive: boolean
    maskedValue: string | null
    updatedAt: Date
  }[]
> {
  const rows = await db
    .select({
      key: integrationSecrets.key,
      encryptedValue: integrationSecrets.encryptedValue,
      iv: integrationSecrets.iv,
      isSensitive: integrationSecrets.isSensitive,
      updatedAt: integrationSecrets.updatedAt,
    })
    .from(integrationSecrets)
    .where(eq(integrationSecrets.service, service))

  return rows.map((row) => {
    let maskedValue: string | null = null
    try {
      const value = decryptSecret(row.encryptedValue, row.iv)
      if (row.isSensitive) {
        maskedValue = value.length <= 4 ? '••••' : '••••••••••••' + value.slice(-4)
      } else {
        maskedValue = value
      }
    } catch {
      maskedValue = '(decryption error)'
    }
    return {
      key: row.key,
      isSensitive: row.isSensitive,
      maskedValue,
      updatedAt: row.updatedAt,
    }
  })
}
