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
