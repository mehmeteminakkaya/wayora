import { z } from 'zod'

// Yalnızca development/test için. Production'da JWT_SECRET zorunlu (aşağıdaki superRefine).
const DEV_JWT_SECRET = 'wayora-dev-only-secret-change-me-32-chars'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // API_PORT önce gelir: araçlar/hosting genel PORT'u başka bir şey için set edebiliyor
    API_PORT: z.coerce.number().int().positive().optional(),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL tanımlı değil (.env.example dosyasına bakın)'),
    // Virgülle ayrılmış izinli origin listesi
    CORS_ORIGIN: z.string().default('http://localhost:5180'),

    // Oturum
    JWT_SECRET: z.string().min(32, 'JWT_SECRET en az 32 karakter olmalı').default(DEV_JWT_SECRET),
    JWT_EXPIRES_IN: z.string().default('7d'),
    COOKIE_NAME: z.string().default('wayora_session'),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),

    // LLM yönlendirme (Week 10: gateway / model routing / fallback)
    LLM_PROVIDER: z.enum(['offline', 'gemini', 'openai', 'deepseek']).default('offline'),
    GEMINI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
    DEEPSEEK_WEB_SEARCH: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    LLM_MODEL_FAST: z.string().default('gemini-2.0-flash'),
    LLM_MODEL_SMART: z.string().default('gemini-2.5-pro'),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).default(20_000),

    // Kötüye kullanım / maliyet koruması
    AI_DAILY_LIMIT: z.coerce.number().int().positive().default(10),

    // Ücretsiz keşif sağlayıcıları. Anahtar yoksa ilgili özellik kapalı kalır.
    TICKETMASTER_API_KEY: z.string().optional(),
    DUFFEL_ACCESS_TOKEN: z.string().optional(),
    DISCOVERY_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(10_000),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEV_JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'Production ortamında JWT_SECRET açıkça tanımlanmalı',
      })
    }
    if (env.NODE_ENV === 'production' && env.COOKIE_SECURE === 'false') {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'Production ortamında oturum çerezi secure olmalı',
      })
    }
    if (env.LLM_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['GEMINI_API_KEY'],
        message: 'LLM_PROVIDER=gemini için GEMINI_API_KEY gerekli',
      })
    }
    if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'LLM_PROVIDER=openai için OPENAI_API_KEY gerekli',
      })
    }
    if (env.LLM_PROVIDER === 'deepseek' && !env.DEEPSEEK_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['DEEPSEEK_API_KEY'],
        message: 'LLM_PROVIDER=deepseek için DEEPSEEK_API_KEY gerekli',
      })
    }
  })

export type Config = Omit<z.infer<typeof envSchema>, 'API_PORT' | 'COOKIE_SECURE'> & {
  PORT: number
  COOKIE_SECURE: boolean
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Geçersiz ortam değişkenleri:\n${issues.join('\n')}`)
  }
  const { API_PORT, COOKIE_SECURE, ...rest } = parsed.data
  return {
    ...rest,
    PORT: API_PORT ?? rest.PORT,
    COOKIE_SECURE: COOKIE_SECURE === 'true' || (COOKIE_SECURE === undefined && rest.NODE_ENV === 'production'),
  }
}
