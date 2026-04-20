import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export function createSession(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')

  const expires = (Date.now() + SESSION_DURATION_MS).toString()
  const hmac = createHmac('sha256', secret).update(expires).digest('hex')
  return `${expires}:${hmac}`
}

export function verifySession(value: string): boolean {
  const secret = process.env.AUTH_SECRET
  if (!secret) return false

  const colonIndex = value.indexOf(':')
  if (colonIndex === -1) return false

  const expires = value.slice(0, colonIndex)
  const hmac = value.slice(colonIndex + 1)

  const expected = createHmac('sha256', secret).update(expires).digest('hex')

  // Check HMAC before expiry to avoid creating a timing side-channel that
  // distinguishes "expired but valid signature" from "invalid signature".
  let valid = false
  try {
    valid =
      hmac.length === expected.length &&
      timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
  } catch {
    return false
  }

  return valid && Date.now() <= parseInt(expires, 10)
}
