import type { RequestHandler } from 'express'
import { verifySession } from '../lib/jwt.ts'
import { HttpError } from './error.ts'

export function requireAuth(options: { secret: string; cookieName: string }): RequestHandler {
  return (req, _res, next) => {
    const token: unknown = req.cookies?.[options.cookieName]
    const userId = typeof token === 'string' ? verifySession(token, options.secret) : null
    if (!userId) {
      next(new HttpError(401, 'UNAUTHORIZED', 'Bu işlem için giriş yapmalısınız'))
      return
    }
    req.userId = userId
    next()
  }
}
