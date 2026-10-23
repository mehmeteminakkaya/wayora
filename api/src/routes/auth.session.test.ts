import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp } from '../test-app.ts'

const creds = { email: 'ayse@example.com', password: 'gizli-sifre-123' }

async function registered() {
  const ctx = createTestApp()
  await request(ctx.app).post('/api/auth/register').send(creds)
  return ctx
}

describe('POST /api/auth/login (W-11)', () => {
  it('doğru bilgilerle giriş yapar ve oturum çerezi verir', async () => {
    const { app } = await registered()
    const res = await request(app).post('/api/auth/login').send({ ...creds, email: 'AYSE@example.com' })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(creds.email)
    expect(String(res.headers['set-cookie'])).toContain('HttpOnly')
  })

  it('yanlış şifre ve kayıtlı olmayan e-posta için aynı hatayı döner', async () => {
    const { app } = await registered()
    const wrong = await request(app).post('/api/auth/login').send({ ...creds, password: 'yanlis-sifre' })
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kimse@example.com', password: 'yanlis-sifre' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body).toEqual(unknown.body)
    expect(wrong.body.error.message).toBe('E-posta veya şifre hatalı')
  })
})

describe('GET /api/auth/me ve oturum (W-11)', () => {
  it('oturum açıkken kullanıcıyı döner, oturum yokken 401', async () => {
    const { app } = await registered()
    const agent = request.agent(app)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
    await agent.post('/api/auth/login').send(creds)
    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user).toEqual({ id: expect.any(String), email: creds.email, name: null })
  })

  it('kayıttan hemen sonra oturum açık olur', async () => {
    const { app } = createTestApp()
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(creds)
    expect((await agent.get('/api/auth/me')).status).toBe(200)
  })

  it('çıkış yapınca oturum kapanır', async () => {
    const { app } = await registered()
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send(creds)
    const out = await agent.post('/api/auth/logout')
    expect(out.status).toBe(204)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('başka anahtarla imzalanmış ya da bozuk çerezi kabul etmez', async () => {
    const { app } = await registered()
    const login = await request(app).post('/api/auth/login').send(creds)
    const cookie = String(login.headers['set-cookie']).split(';')[0]
    const tampered = cookie.slice(0, -2) + (cookie.endsWith('aa') ? 'bb' : 'aa')
    const res = await request(app).get('/api/auth/me').set('Cookie', tampered)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
