import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp } from './test-app.ts'

describe('GET /api/health', () => {
  it('veritabanı erişilebilirken db: ok döner', async () => {
    const { app } = createTestApp()
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'ok' })
  })

  it('veritabanı erişilemezken db: error döner', async () => {
    const { app } = createTestApp({
      checkDb: async () => {
        throw new Error('bağlantı yok')
      },
    })
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'error' })
  })
})

describe('bilinmeyen yollar', () => {
  it('standart hata biçimiyle 404 döner', async () => {
    const { app } = createTestApp()
    const res = await request(app).get('/api/yok-boyle-bir-sey')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'İstenen kaynak bulunamadı' },
    })
  })
})

describe('bozuk JSON', () => {
  it('500 yerine anlaşılır bir 400 döner', async () => {
    const { app } = createTestApp()
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email":')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_JSON')
  })
})
