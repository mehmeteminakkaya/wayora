import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/error.ts'
import { healthRouter } from './routes/health.ts'

export type AppDeps = {
  corsOrigin: string
  checkDb: () => Promise<void>
}

export function createApp({ corsOrigin, checkDb }: AppDeps) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRouter(checkDb))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
