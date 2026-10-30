import { existsSync } from 'node:fs'
import { createPrisma } from '../src/lib/prisma.ts'
import { seedCityCatalog } from '../src/services/city-catalog.ts'

if (existsSync('.env')) process.loadEnvFile('.env')
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL gerekli')

const db = createPrisma(databaseUrl)
try {
  await seedCityCatalog(db)
  const [cities, experiences] = await Promise.all([
    db.city.count(),
    db.cityExperience.count(),
  ])
  console.log(JSON.stringify({ cities, experiences }, null, 2))
} finally {
  await db.$disconnect()
}
