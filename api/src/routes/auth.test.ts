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

const credentials = { email: 'bayram@example.com', password: 'parola123', name: 'Bayram' }

describe('auth akışı', () => {
  it('kayıt olur, oturum çerezi verir ve /me döner', async () => {
    const app = makeApp()
    const register = await request(app).post('/api/auth/register').send(credentials)

    expect(register.status).toBe(201)
    expect(register.body.user).toMatchObject({ email: credentials.email, name: credentials.name })
    expect(register.headers['set-cookie']).toBeDefined()

    const me = await request(app).get('/api/auth/me').set('Cookie', cookieFrom(register))
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(credentials.email)
  })

  it('aynı e-posta ile ikinci kaydı 409 ile reddeder', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)
    const second = await request(app).post('/api/auth/register').send(credentials)
    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('kısa şifreyi doğrulama hatasıyla reddeder', async () => {
    const res = await request(makeApp())
      .post('/api/auth/register')
      .send({ email: 'x@example.com', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('doğru bilgilerle giriş yapar, yanlış şifreyi reddeder', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'yanlis-parola' })
    expect(wrong.status).toBe(401)
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
    expect(login.status).toBe(200)
    expect(login.body.user.email).toBe(credentials.email)
  })

  it('oturum yokken /me 401 döner', async () => {
    const res = await request(makeApp()).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('çıkış çerezi temizler', async () => {
    const res = await request(makeApp()).post('/api/auth/logout')
    expect(res.status).toBe(204)
    expect(String(res.headers['set-cookie'])).toContain('wayora_session=;')
  })
})

describe('tercihler', () => {
  it('giriş yapan kullanıcının tercihlerini kaydeder ve okur', async () => {
    const app = makeApp()
    const register = await request(app).post('/api/auth/register').send(credentials)
    const cookie = cookieFrom(register)

    const payload = {
      interests: ['müze', 'yemek'],
      budgetLevel: 'mid',
      travelStyle: 'balanced',
      pace: 'moderate',
    }
    const put = await request(app).put('/api/me/preferences').set('Cookie', cookie).send(payload)
    expect(put.status).toBe(200)
    expect(put.body.preference).toMatchObject(payload)

    const get = await request(app).get('/api/me/preferences').set('Cookie', cookie)
    expect(get.status).toBe(200)
    expect(get.body.preference.interests).toEqual(payload.interests)
  })

  it('giriş yokken tercihlere erişemez', async () => {
    const res = await request(makeApp()).get('/api/me/preferences')
    expect(res.status).toBe(401)
  })
})
