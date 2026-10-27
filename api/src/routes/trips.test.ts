import request from 'supertest'
import type { Response } from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { createFakeDb } from '../test/fake-db.ts'

const corsOrigin = 'http://localhost:5180'
const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function cookieFrom(response: Response): string {
  const header = response.headers['set-cookie']
  const values = Array.isArray(header) ? header : header ? [header] : []
  return values.map((value) => value.split(';')[0]).join('; ')
}

const validTrip = {
  title: 'Paris testi',
  destination: 'Paris',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  budget: 500,
  currency: 'EUR',
}

describe('trip doğrulama ve yetki', () => {
  let app: ReturnType<typeof createApp>
  let cookie: string

  beforeEach(async () => {
    app = createApp({ corsOrigin, checkDb: async () => {}, db: createFakeDb(), config })
    const register = await request(app)
      .post('/api/auth/register')
      .send({ email: 'gezgin@example.com', password: 'parola123' })
    cookie = cookieFrom(register)
  })

  it('oturum yokken gezilere erişemez', async () => {
    const res = await request(app).get('/api/trips')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('bitiş tarihi başlangıçtan önceyse 400 döner', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Cookie', cookie)
      .send({ ...validTrip, endDate: '2026-11-01' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(res.body.error.message).toMatch(/Bitiş tarihi/)
  })

  it('21 günden uzun geziyi reddeder', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Cookie', cookie)
      .send({ ...validTrip, startDate: '2026-11-01', endDate: '2026-11-30' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/21 gün/)
  })

  it('geçersiz para birimini reddeder', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Cookie', cookie)
      .send({ ...validTrip, currency: 'EURO' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('boş başlığı reddeder', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Cookie', cookie)
      .send({ ...validTrip, title: '   ' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('AI üretimi için de oturum ister', async () => {
    const res = await request(app).post('/api/trips/00000000-0000-0000-0000-000000000000/generate')
    expect(res.status).toBe(401)
  })
})
