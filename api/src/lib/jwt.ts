import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

export type SessionPayload = { sub: string }

export function signSession(
  userId: string,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign({ sub: userId } satisfies SessionPayload, secret, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  })
}

export function verifySession(token: string, secret: string): string | null {
  try {
    const payload = jwt.verify(token, secret)
    if (typeof payload === 'object' && payload !== null && typeof payload.sub === 'string') {
      return payload.sub
    }
    return null
  } catch {
    return null
  }
}
