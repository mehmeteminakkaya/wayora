import type { Response } from 'express'
import jwt from 'jsonwebtoken'

// Oturum: JWT, httpOnly çerezde. Tarayıcıdaki JavaScript çereze erişemez (XSS'e karşı).
export const SESSION_COOKIE = 'wayora_session'
const SESSION_DAYS = 7

export type SessionOptions = { secret: string; secureCookie: boolean }

export function startSession(res: Response, userId: string, { secret, secureCookie }: SessionOptions) {
  const token = jwt.sign({}, secret, { subject: userId, expiresIn: `${SESSION_DAYS}d` })
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function endSession(res: Response, { secureCookie }: Pick<SessionOptions, 'secureCookie'>) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/' })
}

// Geçerli bir oturum çereziyse kullanıcı id'sini, değilse (yok/bozuk/süresi dolmuş) null döner
export function readSession(token: unknown, secret: string): string | null {
  if (typeof token !== 'string' || token === '') return null
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] })
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
