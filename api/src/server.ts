import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createPrisma } from './lib/prisma.ts'
import { seedCityCatalog } from './services/city-catalog.ts'

const config = loadConfig()
const prisma = createPrisma(config.DATABASE_URL)

try {
  await seedCityCatalog(prisma)
} catch (error) {
  // Katalog migration'ı henüz uygulanmamışsa API yine açılır; /api/cities statik kataloğa düşer.
  console.error('[city-catalog] seed başarısız:', error)
}

const app = createApp({
  corsOrigin: config.CORS_ORIGIN,
  db: prisma,
  config,
  checkDb: async () => {
    await prisma.$queryRaw`SELECT 1`
  },
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
