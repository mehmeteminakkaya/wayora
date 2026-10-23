import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Prisma 7 .env dosyasını kendisi okumuyor; varsa Node'un yerleşik yükleyicisiyle okuyoruz
if (existsSync('.env')) process.loadEnvFile('.env')

const url = process.env.DATABASE_URL ?? ''

// `prisma migrate dev` geçici bir "shadow" veritabanında migration'ları baştan dener. Yerel `prisma dev`
// sunucusunda uygulama veritabanı `template1` (Postgres'in şablon veritabanı); shadow'u ondan
// oluşturmaya çalışınca tablolar kopyalanıp "relation already exists" hatası çıkıyor. `prisma dev`
// bunun için ayrı bir shadow sunucusu açıyor (ana port + 1). .env'de SHADOW_DATABASE_URL yoksa onu kullan.
const LOCAL_DB = 'localhost:51214'
const LOCAL_SHADOW_DB = 'localhost:51215'
const shadowDatabaseUrl =
  process.env.SHADOW_DATABASE_URL ??
  (url.includes(LOCAL_DB) ? url.replace(LOCAL_DB, LOCAL_SHADOW_DB) : undefined)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // `prisma generate` URL istemez; migrate komutları için .env'de DATABASE_URL olmalı
    url,
    shadowDatabaseUrl,
  },
})
