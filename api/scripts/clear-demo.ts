import { existsSync } from 'node:fs'
import { createPrisma } from '../src/lib/prisma.ts'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL ?? ''
const isLocalDatabase =
  databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
const allowRemoteDemo = process.env.DEMO_SEED_ALLOW_PRODUCTION === 'true'

if ((!isLocalDatabase || process.env.NODE_ENV === 'production') && !allowRemoteDemo) {
  throw new Error(
    'Demo verisini silmek için local veritabanı gerekir. Production temizliği için DEMO_SEED_ALLOW_PRODUCTION=true kullan.',
  )
}

const db = createPrisma(databaseUrl)

try {
  const result = await db.user.deleteMany({
    where: {
      OR: [{ email: 'demo@wayora.app' }, { email: { startsWith: 'demo+' } }],
    },
  })
  console.log(`Demo hesapları ve profilleri silindi: ${result.count}`)
} finally {
  await db.$disconnect()
}
