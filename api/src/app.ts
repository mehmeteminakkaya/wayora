import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import type { Config } from './config.ts'
import type { Db } from './lib/prisma.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { authRouter } from './routes/auth.ts'
import { healthRouter } from './routes/health.ts'
import { placeRouter } from './routes/places.ts'
import { preferenceRouter } from './routes/preferences.ts'
import { activityRouter, tripRouter } from './routes/trips.ts'

export type AppDeps = {
  corsOrigin: string
  checkDb: () => Promise<void>
  db: Db
  config: Config
  generateLimiter?: RequestHandler
}

export function createApp({ corsOrigin, checkDb, db, config, generateLimiter }: AppDeps) {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  const isTest = config.NODE_ENV === 'test'
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: { code: 'RATE_LIMITED', message: 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' } },
  })

  const aiLimiter =
    generateLimiter ??
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      limit: config.AI_DAILY_LIMIT,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: () => isTest,
      message: {
        error: {
          code: 'AI_LIMIT_REACHED',
          message: 'Günlük AI plan limitine ulaştınız. Yarın tekrar deneyin.',
        },
      },
    })

  app.use('/api/health', healthRouter(checkDb))
  app.use('/api/auth', authLimiter, authRouter({ db, config }))
  app.use('/api/me/preferences', preferenceRouter({ db, config }))
  app.use('/api/trips', tripRouter({ db, config, generateLimiter: aiLimiter }))
  app.use('/api/activities', activityRouter({ db, config }))
  app.use('/api/places', placeRouter({ db, config }))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
