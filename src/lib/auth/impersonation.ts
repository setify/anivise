import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'impersonation'
const MAX_AGE = 2 * 60 * 60 // 2 hours in seconds

function getSecret(): string {
  const secret = process.env.IMPERSONATION_SECRET
  if (!secret) {
    throw new Error(
      'IMPERSONATION_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    )
  }
  return secret
}

interface ImpersonationData {
  orgId: string
  orgName: string
  role: string
  startedAt: number
}

function sign(data: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(data)
  return hmac.digest('hex')
}

function verify(data: string, signature: string): boolean {
  const expected = sign(data)
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )
}

export async function startImpersonation(orgId: string, orgName: string, role: string) {
  const data: ImpersonationData = {
    orgId,
    orgName,
    role,
    startedAt: Date.now(),
  }
  const payload = JSON.stringify(data)
  const signature = sign(payload)
  const cookieValue = `${Buffer.from(payload).toString('base64')}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function endImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getImpersonation(): Promise<ImpersonationData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return null

  try {
    const [encodedPayload, signature] = cookie.value.split('.')
    if (!encodedPayload || !signature) return null

    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8')
    if (!verify(payload, signature)) return null

    const data: ImpersonationData = JSON.parse(payload)

    // Check timeout (2 hours)
    if (Date.now() - data.startedAt > MAX_AGE * 1000) {
      const cs = await cookies()
      cs.delete(COOKIE_NAME)
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Parse impersonation cookie value without using next/headers (for middleware).
 */
export function parseImpersonationCookie(cookieValue: string): ImpersonationData | null {
  try {
    const [encodedPayload, signature] = cookieValue.split('.')
    if (!encodedPayload || !signature) return null

    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8')
    if (!verify(payload, signature)) return null

    const data: ImpersonationData = JSON.parse(payload)

    if (Date.now() - data.startedAt > MAX_AGE * 1000) {
      return null
    }

    return data
  } catch {
    return null
  }
}
