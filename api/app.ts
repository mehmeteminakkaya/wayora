import { createApp } from './src/app.ts'
import { loadConfig } from './src/config.ts'
import { createPrisma } from './src/lib/prisma.ts'

/**
 * Vercel Express entrypoint.
 *
 * Yerel geliştirmede `src/server.ts` kullanılır. Vercel'de Prisma client'ı modül
 * ömrü boyunca tek kez oluşturup Express uygulamasını default export ediyoruz.
 */
const config = loadConfig()
const db = createPrisma(config.DATABASE_URL)

const app = createApp({
  corsOrigin: config.CORS_ORIGIN,
  db,
  config,
  checkDb: async () => {
    await db.$queryRaw`SELECT 1`
  },
})

export default app
