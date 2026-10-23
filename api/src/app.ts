import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { requireAuth } from './middleware/auth.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { activitiesRouter } from './routes/activities.ts'
import { authRouter } from './routes/auth.ts'
import { healthRouter } from './routes/health.ts'
import { preferencesRouter } from './routes/preferences.ts'
import { tripsRouter } from './routes/trips.ts'
import type { Store } from './store/types.ts'

export type AppDeps = {
  corsOrigin: string
  checkDb: () => Promise<void>
  store: Store
  jwtSecret: string
  secureCookie: boolean
  bcryptRounds: number
}

export function createApp({ corsOrigin, checkDb, store, jwtSecret, secureCookie, bcryptRounds }: AppDeps) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use('/api/health', healthRouter(checkDb))
  app.use('/api/auth', authRouter(store, { secret: jwtSecret, secureCookie, bcryptRounds }))

  // Buradan sonraki her şey oturum ister
  const auth = requireAuth(store, jwtSecret)
  app.use('/api/me/preferences', auth, preferencesRouter(store))
  app.use('/api/trips', auth, tripsRouter(store))
  app.use('/api/trips/:tripId', auth, activitiesRouter(store))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
