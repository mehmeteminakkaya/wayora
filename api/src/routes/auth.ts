import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { startSession, type SessionOptions } from '../lib/session.ts'
import { parseBody } from '../lib/validation.ts'
import { HttpError } from '../middleware/error.ts'
import { EmailTakenError, type Store, type User } from '../store/types.ts'

export type AuthOptions = SessionOptions & { bcryptRounds: number }

const email = z
  .string({ error: 'E-posta zorunlu' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Geçerli bir e-posta adresi girin' }))

const registerSchema = z.object({
  email,
  // bcrypt yalnızca ilk 72 baytı kullanır; daha uzun şifreyi sessizce kesmek yerine reddediyoruz
  password: z
    .string({ error: 'Şifre zorunlu' })
    .min(8, { error: 'Şifre en az 8 karakter olmalı' })
    .refine((p) => Buffer.byteLength(p) <= 72, { error: 'Şifre en fazla 72 bayt olabilir' }),
  name: z
    .string()
    .trim()
    .max(80, { error: 'Ad en fazla 80 karakter olabilir' })
    .optional()
    .transform((n) => n || null),
})

// Yanıtlarda şifre özeti asla yer almaz
export const publicUser = ({ id, email, name }: User) => ({ id, email, name })

export function authRouter(store: Store, options: AuthOptions) {
  const router = Router()

  router.post('/register', async (req, res) => {
    const input = parseBody(registerSchema, req.body)
    const passwordHash = await bcrypt.hash(input.password, options.bcryptRounds)
    let user: User
    try {
      user = await store.users.create({ email: input.email, passwordHash, name: input.name })
    } catch (err) {
      if (err instanceof EmailTakenError) {
        throw new HttpError(409, 'EMAIL_TAKEN', 'Bu e-posta adresiyle zaten bir hesap var', {
          email: 'Bu e-posta adresiyle zaten bir hesap var',
        })
      }
      throw err
    }
    startSession(res, user.id, options)
    res.status(201).json({ user: publicUser(user) })
  })

  return router
}
