import bcrypt from 'bcryptjs'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { SESSION_COOKIE } from '../lib/session.ts'
import { createTestApp } from '../test-app.ts'

const valid = { email: 'ayse@example.com', password: 'gizli-sifre-123', name: 'Ayşe' }

describe('POST /api/auth/register (W-10)', () => {
  it('kullanıcıyı oluşturur, oturum çerezi verir ve şifre özetini döndürmez', async () => {
    const { app, store } = createTestApp()
    const res = await request(app).post('/api/auth/register').send(valid)

    expect(res.status).toBe(201)
    expect(res.body.user).toEqual({ id: expect.any(String), email: valid.email, name: 'Ayşe' })
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')

    const cookie = String(res.headers['set-cookie'])
    expect(cookie).toContain(`${SESSION_COOKIE}=`)
    expect(cookie).toContain('HttpOnly')

    const saved = await store.users.findByEmail(valid.email)
    expect(saved?.passwordHash).not.toBe(valid.password)
    expect(await bcrypt.compare(valid.password, saved!.passwordHash)).toBe(true)
  })

  it('e-postayı küçük harfe çevirip boşlukları temizler', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: '  Ayse@Example.COM ' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('ayse@example.com')
  })

  it('aynı e-posta ikinci kez kaydolamaz (büyük/küçük harf farkı dahil)', async () => {
    const { app } = createTestApp()
    await request(app).post('/api/auth/register').send(valid)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: 'AYSE@example.com' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
    expect(res.body.error.fields.email).toBe('Bu e-posta adresiyle zaten bir hesap var')
  })

  it('geçersiz e-posta için Türkçe alan hatası döner', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: 'ayse-at-example' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
    expect(res.body.error.fields.email).toBe('Geçerli bir e-posta adresi girin')
  })

  it('kısa şifre için Türkçe alan hatası döner', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, password: 'kisa' })
    expect(res.status).toBe(400)
    expect(res.body.error.fields.password).toBe('Şifre en az 8 karakter olmalı')
  })

  it('72 bayttan uzun şifreyi reddeder (bcrypt sınırı)', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, password: 'ş'.repeat(40) })
    expect(res.status).toBe(400)
    expect(res.body.error.fields.password).toBe('Şifre en fazla 72 bayt olabilir')
  })

  it('ad verilmezse null kaydeder', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: valid.email, password: valid.password })
    expect(res.status).toBe(201)
    expect(res.body.user.name).toBeNull()
  })
})
