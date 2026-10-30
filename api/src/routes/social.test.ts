import request from 'supertest'
import type { Response } from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { createFakeDb } from '../test/fake-db.ts'

const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function app() {
  return createApp({
    corsOrigin: 'http://localhost:5180',
    checkDb: async () => {},
    db: createFakeDb(),
    config,
  })
}

function cookieFrom(response: Response): string {
  const header = response.headers['set-cookie']
  const values = Array.isArray(header) ? header : header ? [header] : []
  return values.map((value) => value.split(';')[0]).join('; ')
}

const credentials = {
  email: 'elif@example.com',
  password: 'parola123',
  name: 'Elif',
}

describe('Yol Arkadaşları auth sınırı', () => {
  it('profil endpointi oturum olmadan veri döndürmez', async () => {
    const response = await request(app()).get('/api/social/profile')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('eşleşme endpointi oturum olmadan çalışmaz', async () => {
    const response = await request(app()).get('/api/social/matches')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('güvenlik onayıyla profil kaydeder ve geri okur', async () => {
    const testApp = app()
    const register = await request(testApp).post('/api/auth/register').send(credentials)
    const cookie = cookieFrom(register)

    const saved = await request(testApp)
      .put('/api/social/profile')
      .set('Cookie', cookie)
      .send({
        displayName: 'Elif',
        bio: 'Müzeleri ve yerel mutfağı seven sakin bir gezgin.',
        languages: ['Türkçe', 'İngilizce'],
        hostingAvailable: false,
        hostingNote: null,
        visible: true,
        safetyAccepted: true,
      })
    expect(saved.status).toBe(200)
    expect(saved.body.profile).toMatchObject({ displayName: 'Elif', visible: true })

    const read = await request(testApp)
      .get('/api/social/profile')
      .set('Cookie', cookie)
    expect(read.status).toBe(200)
    expect(read.body.profile.displayName).toBe('Elif')
    expect(read.body.profile.safetyAccepted).toBe(true)
  })

  it('güvenlik onayı olmadan görünür profili reddeder', async () => {
    const testApp = app()
    const register = await request(testApp).post('/api/auth/register').send(credentials)
    const response = await request(testApp)
      .put('/api/social/profile')
      .set('Cookie', cookieFrom(register))
      .send({
        displayName: 'Elif',
        bio: 'Müzeleri ve yerel mutfağı seven sakin bir gezgin.',
        languages: ['Türkçe'],
        hostingAvailable: false,
        visible: true,
        safetyAccepted: false,
      })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('SAFETY_ACCEPTANCE_REQUIRED')
  })
})
