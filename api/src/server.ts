import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createPrisma } from './lib/prisma.ts'
import { createPrismaStore } from './store/prisma.ts'

const config = loadConfig()
const prisma = createPrisma(config.DATABASE_URL)

const app = createApp({
  corsOrigin: config.CORS_ORIGIN,
  checkDb: async () => {
    await prisma.$queryRaw`SELECT 1`
  },
  store: createPrismaStore(prisma),
  jwtSecret: config.JWT_SECRET,
  secureCookie: config.NODE_ENV === 'production',
  bcryptRounds: 10,
})

const server = app.listen(config.PORT, () => {
  console.log(`Wayora API → http://localhost:${config.PORT}`)
})

async function shutdown() {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
