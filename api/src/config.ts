import { z } from 'zod'

// Sadece geliştirme/test için. Üretimde JWT_SECRET zorunlu (aşağıda kontrol ediliyor).
const DEV_JWT_SECRET = 'wayora-dev-secret-uretimde-kullanmayin-0000000000'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // API_PORT önce gelir: araçlar/hosting genel PORT'u başka bir şey için set edebiliyor
  API_PORT: z.coerce.number().int().positive().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL tanımlı değil (.env.example dosyasına bakın)'),
  // Virgülle ayrılmış izinli origin listesi
  CORS_ORIGIN: z.string().default('http://localhost:5180'),
  // Oturum çerezindeki JWT'yi imzalar
  JWT_SECRET: z.string().min(32, 'JWT_SECRET en az 32 karakter olmalı').optional(),
})

export type Config = Omit<z.infer<typeof envSchema>, 'API_PORT' | 'JWT_SECRET'> & {
  JWT_SECRET: string
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Geçersiz ortam değişkenleri:\n${issues.join('\n')}`)
  }
  const { API_PORT, JWT_SECRET, ...rest } = parsed.data
  if (!JWT_SECRET && rest.NODE_ENV === 'production') {
    throw new Error('Geçersiz ortam değişkenleri:\n  - JWT_SECRET: üretimde zorunlu')
  }
  return { ...rest, PORT: API_PORT ?? rest.PORT, JWT_SECRET: JWT_SECRET ?? DEV_JWT_SECRET }
}
