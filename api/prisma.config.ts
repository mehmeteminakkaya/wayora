import { defineConfig } from 'prisma/config'

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
