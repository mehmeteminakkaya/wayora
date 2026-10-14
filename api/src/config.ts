import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // API_PORT önce gelir: araçlar/hosting genel PORT'u başka bir şey için set edebiliyor
  API_PORT: z.coerce.number().int().positive().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL tanımlı değil (.env.example dosyasına bakın)'),
  // Virgülle ayrılmış izinli origin listesi
  CORS_ORIGIN: z.string().default('http://localhost:5180'),
})

export type Config = Omit<z.infer<typeof envSchema>, 'API_PORT'>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Geçersiz ortam değişkenleri:\n${issues.join('\n')}`)
  }
  const { API_PORT, ...rest } = parsed.data
  return { ...rest, PORT: API_PORT ?? rest.PORT }
}
