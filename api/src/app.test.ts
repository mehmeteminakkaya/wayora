import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createFakeDb } from './test/fake-db.ts'

const corsOrigin = 'http://localhost:5180'
const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function makeApp() {
  return createApp({ corsOrigin, checkDb: async () => {}, db: createFakeDb(), config })
}

describe('GET /api/health', () => {
  it('veritabanı erişilebilirken db: ok döner', async () => {
    const res = await request(makeApp()).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'ok' })
  })

  it('veritabanı erişilemezken db: error döner', async () => {
    const app = createApp({
      corsOrigin,
      checkDb: async () => {
        throw new Error('bağlantı yok')
      },
      db: createFakeDb(),
      config,
    })
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'error' })
  })
})

describe('bilinmeyen yollar', () => {
  it('standart hata biçimiyle 404 döner', async () => {
    const res = await request(makeApp()).get('/api/yok-boyle-bir-sey')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'İstenen kaynak bulunamadı' },
    })
  })

  it('bozuk JSON gövdesini 400 ile reddeder', async () => {
    const res = await request(makeApp())
      .post('/api/auth/login')
      .set('content-type', 'application/json')
      .send('{bozuk')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })
})
