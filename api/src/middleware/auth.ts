import type { RequestHandler, Response } from 'express'
import { readSession, SESSION_COOKIE } from '../lib/session.ts'
import type { Store } from '../store/types.ts'
import { HttpError } from './error.ts'

// Oturum yoksa 401 döner; varsa kullanıcı id'sini res.locals.userId'ye koyar
export function requireAuth(store: Store, secret: string): RequestHandler {
  return async (req, res, next) => {
    const userId = readSession(req.cookies?.[SESSION_COOKIE], secret)
    // Hesap silinmişse eski çerez de geçersiz sayılır
    if (!userId || !(await store.users.findById(userId))) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Bu işlem için giriş yapmalısın')
    }
    res.locals.userId = userId
    next()
  }
}

export const currentUserId = (res: Response): string => res.locals.userId
