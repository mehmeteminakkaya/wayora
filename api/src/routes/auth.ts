import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import type { Config } from '../config.ts'
import { signSession } from '../lib/jwt.ts'
import { hashPassword, verifyPassword } from '../lib/password.ts'
import type { Db } from '../lib/prisma.ts'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError, parseOrThrow } from '../middleware/error.ts'

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı').max(72, 'Şifre en fazla 72 karakter olabilir'),
  name: z.string().trim().min(1, 'İsim boş olamaz').max(80).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

// E-posta var/yok bilgisini zamanlama üzerinden sızdırmamak için sabit bir hash.
// Gerçek bir kullanıcıya ait değil; hiçbir şifreyi doğrulamaz.
// nosemgrep: generic.secrets.security.detected-bcrypt-hash.detected-bcrypt-hash
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZBj0P5x7h1r0p9Q0jXy0i8Z9m8G1a2'

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function setSessionCookie(res: Response, config: Config, userId: string) {
  const token = signSession(userId, config.JWT_SECRET, config.JWT_EXPIRES_IN)
  res.cookie(config.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  })
}

function publicUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name }
}

export function authRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()

  router.post('/register', async (req, res) => {
    const input = parseOrThrow(registerSchema, req.body)

    try {
      const user = await db.user.create({
        data: {
          email: input.email,
          passwordHash: await hashPassword(input.password),
          name: input.name,
          preference: { create: {} },
        },
        select: { id: true, email: true, name: true },
      })
      setSessionCookie(res, config, user.id)
      res.status(201).json({ user: publicUser(user) })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new HttpError(409, 'EMAIL_TAKEN', 'Bu e-posta adresi zaten kayıtlı')
      }
      throw error
    }
  })

  router.post('/login', async (req, res) => {
    const input = parseOrThrow(loginSchema, req.body)
    const user = await db.user.findUnique({ where: { email: input.email } })
    const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !valid) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı')
    }
    setSessionCookie(res, config, user.id)
    res.json({ user: publicUser(user) })
  })

  router.post('/logout', (_req, res) => {
    res.clearCookie(config.COOKIE_NAME, { path: '/' })
    res.status(204).end()
  })

  router.get(
    '/me',
    requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }),
    async (req, res) => {
      const user = await db.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, name: true },
      })
      if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Oturum geçersiz')
      res.json({ user: publicUser(user) })
    },
  )

  return router
}
