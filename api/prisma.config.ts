import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Prisma 7 .env dosyasını kendisi okumuyor; varsa Node'un yerleşik yükleyicisiyle okuyoruz
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // `prisma generate` URL istemez; migrate komutları için .env'de DATABASE_URL olmalı
    url: process.env.DATABASE_URL ?? '',
  },
})
