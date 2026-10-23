import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, signedInAgent } from '../test-app.ts'

const valid = { destination: 'Roma', startDate: '2026-11-02', endDate: '2026-11-04', budget: 15000 }

describe('POST /api/trips (W-13)', () => {
  it('geziyi ve gün sayısı kadar günü oluşturur', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent.post('/api/trips').send(valid)

    expect(res.status).toBe(201)
    expect(res.body.trip).toMatchObject({
      title: 'Roma',
      destination: 'Roma',
      startDate: '2026-11-02',
      endDate: '2026-11-04',
      budget: 15000,
      currency: 'TRY',
      status: 'DRAFT',
    })
    expect(res.body.trip.days.map((d: { dayIndex: number; date: string }) => [d.dayIndex, d.date])).toEqual([
      [1, '2026-11-02'],
      [2, '2026-11-03'],
      [3, '2026-11-04'],
    ])
  })

  it('tek günlük gezi oluşturabilir; başlık ve bütçe isteğe bağlıdır', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent
      .post('/api/trips')
      .send({ destination: 'Kapadokya', title: 'Balon turu', startDate: '2026-11-02', endDate: '2026-11-02' })
    expect(res.status).toBe(201)
    expect(res.body.trip).toMatchObject({ title: 'Balon turu', budget: null })
    expect(res.body.trip.days).toHaveLength(1)
  })

  it('bitiş tarihi başlangıçtan önce olamaz', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent.post('/api/trips').send({ ...valid, endDate: '2026-11-01' })
    expect(res.status).toBe(400)
    expect(res.body.error.fields.endDate).toBe('Bitiş tarihi başlangıçtan önce olamaz')
  })

  it('30 günden uzun geziyi ve geçersiz tarihi reddeder', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const long = await agent.post('/api/trips').send({ ...valid, endDate: '2026-12-02' })
    expect(long.body.error.fields.endDate).toBe('Gezi en fazla 30 gün olabilir')
    const invalid = await agent.post('/api/trips').send({ ...valid, startDate: '2026-02-30' })
    expect(invalid.body.error.fields.startDate).toBe('Başlangıç tarihi geçerli bir tarih olmalı')
  })

  it('eksik destinasyon ve negatif bütçe için Türkçe alan hatası döner', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent.post('/api/trips').send({ ...valid, destination: ' ', budget: -5 })
    expect(res.status).toBe(400)
    expect(res.body.error.fields).toMatchObject({
      destination: 'Destinasyon en az 2 karakter olmalı',
      budget: 'Bütçe sıfırdan büyük olmalı',
    })
  })

  it('oturum olmadan 401 döner', async () => {
    const { app } = createTestApp()
    expect((await request(app).post('/api/trips').send(valid)).status).toBe(401)
  })
})

describe('GET /api/trips/:id (W-13)', () => {
  it('kendi gezisini günleriyle döner', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const created = await agent.post('/api/trips').send(valid)
    const res = await agent.get(`/api/trips/${created.body.trip.id}`)
    expect(res.status).toBe(200)
    expect(res.body.trip).toEqual(created.body.trip)
  })

  it('başkasının gezisi ve olmayan gezi için 404 döner', async () => {
    const { app } = createTestApp()
    const ayse = await signedInAgent(app, 'ayse@example.com')
    const ali = await signedInAgent(app, 'ali@example.com')
    const { body } = await ayse.post('/api/trips').send(valid)

    const other = await ali.get(`/api/trips/${body.trip.id}`)
    expect(other.status).toBe(404)
    expect(other.body.error).toEqual({ code: 'TRIP_NOT_FOUND', message: 'Gezi bulunamadı' })
    expect((await ali.get('/api/trips/olmayan-id')).status).toBe(404)
  })
})
