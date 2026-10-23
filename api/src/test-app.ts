import type { Express } from 'express'
import request from 'supertest'
import { createApp, type AppDeps } from './app.ts'
import { createMemoryStore } from './store/memory.ts'

// Testler için uygulama: bellek içi depo, hızlı bcrypt, sabit gizli anahtar
export function createTestApp(overrides: Partial<AppDeps> = {}) {
  const store = overrides.store ?? createMemoryStore()
  const app = createApp({
    corsOrigin: 'http://localhost:5180',
    checkDb: async () => {},
    store,
    jwtSecret: 'test-secret-test-secret-test-secret-00',
    secureCookie: false,
    bcryptRounds: 4,
    ...overrides,
  })
  return { app, store }
}

// Kayıt olup oturum çerezini taşıyan bir istemci döner
export async function signedInAgent(app: Express, email = 'ayse@example.com') {
  const agent = request.agent(app)
  const res = await agent.post('/api/auth/register').send({ email, password: 'gizli-sifre-123' })
  if (res.status !== 201) throw new Error(`Kayıt başarısız: ${res.status}`)
  return agent
}
