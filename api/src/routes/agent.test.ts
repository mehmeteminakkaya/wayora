import request from 'supertest'
import type { Response } from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { createFakeDb } from '../test/fake-db.ts'

const corsOrigin = 'http://localhost:5180'
const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function makeApp() {
  return createApp({ corsOrigin, checkDb: async () => {}, db: createFakeDb(), config })
}

function cookieFrom(response: Response): string {
  const header = response.headers['set-cookie']
  const values = Array.isArray(header) ? header : header ? [header] : []
  return values.map((value) => value.split(';')[0]).join('; ')
}

const credentials = { email: 'ajan@example.com', password: 'parola123', name: 'Ajan' }

describe('Wayora Agent route', () => {
  it('oturum olmadan sohbeti reddeder', async () => {
    const response = await request(makeApp())
      .post('/api/agent/chat')
      .send({ messages: [{ role: 'user', content: 'Merhaba' }] })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('anahtar yokken kullanıcıya eyleme dönük 503 döner', async () => {
    const app = makeApp()
    const register = await request(app).post('/api/auth/register').send(credentials)
    const response = await request(app)
      .post('/api/agent/chat')
      .set('Cookie', cookieFrom(register))
      .send({ messages: [{ role: 'user', content: 'Nereden başlayayım?' }] })

    expect(response.status).toBe(503)
    expect(response.body.error.code).toBe('AGENT_UNAVAILABLE')
    expect(response.body.error.message).toContain('Keşfet')
  })

  it('son mesaj kullanıcıdan değilse reddeder', async () => {
    const app = makeApp()
    const register = await request(app).post('/api/auth/register').send(credentials)
    const response = await request(app)
      .post('/api/agent/chat')
      .set('Cookie', cookieFrom(register))
      .send({ messages: [{ role: 'assistant', content: 'Merhaba' }] })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('aşırı uzun sohbet bağlamını maliyet korumasıyla reddeder', async () => {
    const app = makeApp()
    const register = await request(app).post('/api/auth/register').send(credentials)
    const messages = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'assistant' : 'user',
      content: 'x'.repeat(1500),
    }))
    messages.push({ role: 'user', content: 'Son soru' })

    const response = await request(app)
      .post('/api/agent/chat')
      .set('Cookie', cookieFrom(register))
      .send({ messages })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
