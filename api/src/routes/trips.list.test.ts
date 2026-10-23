import { describe, expect, it } from 'vitest'
import { createTestApp, signedInAgent } from '../test-app.ts'

const trip = (destination: string, startDate: string, endDate = startDate) => ({ destination, startDate, endDate })

describe('GET /api/trips (W-14)', () => {
  it('yalnızca kendi gezilerini başlangıç tarihine göre sıralı ve gün sayısıyla döner', async () => {
    const { app } = createTestApp()
    const ayse = await signedInAgent(app, 'ayse@example.com')
    const ali = await signedInAgent(app, 'ali@example.com')
    await ayse.post('/api/trips').send(trip('Roma', '2026-12-01', '2026-12-03'))
    await ayse.post('/api/trips').send(trip('Paris', '2026-11-10'))
    await ali.post('/api/trips').send(trip('Berlin', '2026-10-30'))

    const res = await ayse.get('/api/trips')
    expect(res.status).toBe(200)
    expect(res.body.trips.map((t: { destination: string; dayCount: number }) => [t.destination, t.dayCount])).toEqual([
      ['Paris', 1],
      ['Roma', 3],
    ])
    expect(res.body.trips[0]).not.toHaveProperty('days')
  })

  it('gezi yoksa boş liste döner', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    expect((await agent.get('/api/trips')).body).toEqual({ trips: [] })
  })
})

describe('DELETE /api/trips/:id (W-14)', () => {
  it('kendi gezisini siler; gezi listeden ve detaydan kalkar', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const { body } = await agent.post('/api/trips').send(trip('Roma', '2026-12-01'))

    expect((await agent.delete(`/api/trips/${body.trip.id}`)).status).toBe(204)
    expect((await agent.get(`/api/trips/${body.trip.id}`)).status).toBe(404)
    expect((await agent.get('/api/trips')).body.trips).toEqual([])
  })

  it('başkasının gezisini silemez ve gezi yerinde kalır', async () => {
    const { app } = createTestApp()
    const ayse = await signedInAgent(app, 'ayse@example.com')
    const ali = await signedInAgent(app, 'ali@example.com')
    const { body } = await ayse.post('/api/trips').send(trip('Roma', '2026-12-01'))

    const res = await ali.delete(`/api/trips/${body.trip.id}`)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('TRIP_NOT_FOUND')
    expect((await ayse.get(`/api/trips/${body.trip.id}`)).status).toBe(200)
  })
})
