import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/error.ts'
import { authRouter } from './routes/auth.ts'
import { healthRouter } from './routes/health.ts'
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

  app.use(notFound)
  app.use(errorHandler)

  return app
}
