import type { Express } from 'express'
import { describe, expect, it } from 'vitest'
import { createTestApp, signedInAgent } from '../test-app.ts'

async function tripFor(app: Express, email = 'ayse@example.com') {
  const agent = await signedInAgent(app, email)
  const { body } = await agent
    .post('/api/trips')
    .send({ destination: 'Roma', startDate: '2026-11-02', endDate: '2026-11-03' })
  return { agent, trip: body.trip as { id: string; days: { id: string }[] } }
}

const colosseum = { title: 'Kolezyum', category: 'SIGHTSEEING', startTime: '09:00', endTime: '11:30', estimatedCost: 18 }

describe('POST /api/trips/:id/days/:dayId/activities (W-15)', () => {
  it('güne aktivite ekler; gezi detayında sırasıyla görünür', async () => {
    const { app } = createTestApp()
    const { agent, trip } = await tripFor(app)
    const day = trip.days[0].id

    const first = await agent.post(`/api/trips/${trip.id}/days/${day}/activities`).send(colosseum)
    expect(first.status).toBe(201)
    expect(first.body.activity).toEqual({ id: expect.any(String), order: 1, notes: null, ...colosseum })
    await agent.post(`/api/trips/${trip.id}/days/${day}/activities`).send({ title: 'Trastevere akşam yemeği', category: 'FOOD' })

    const detail = await agent.get(`/api/trips/${trip.id}`)
    const [day1, day2] = detail.body.trip.days
    expect(day1.activities.map((a: { title: string; order: number }) => [a.order, a.title])).toEqual([
      [1, 'Kolezyum'],
      [2, 'Trastevere akşam yemeği'],
    ])
    expect(day2.activities).toEqual([])
  })

  it('yalnızca ad zorunludur; kategori varsayılan olarak OTHER olur', async () => {
    const { app } = createTestApp()
    const { agent, trip } = await tripFor(app)
    const res = await agent.post(`/api/trips/${trip.id}/days/${trip.days[1].id}/activities`).send({ title: 'Serbest zaman' })
    expect(res.status).toBe(201)
    expect(res.body.activity).toMatchObject({ category: 'OTHER', startTime: null, endTime: null, estimatedCost: null })
  })

  it('geçersiz saat, ters saat aralığı ve negatif maliyet için Türkçe hata döner', async () => {
    const { app } = createTestApp()
    const { agent, trip } = await tripFor(app)
    const url = `/api/trips/${trip.id}/days/${trip.days[0].id}/activities`

    const badTime = await agent.post(url).send({ title: 'Müze', startTime: '25:00' })
    expect(badTime.body.error.fields.startTime).toBe('Saat SS:DD biçiminde olmalı (örn. 09:30)')
    const reversed = await agent.post(url).send({ title: 'Müze', startTime: '14:00', endTime: '10:00' })
    expect(reversed.body.error.fields.endTime).toBe('Bitiş saati başlangıçtan sonra olmalı')
    const negative = await agent.post(url).send({ title: 'Müze', estimatedCost: -1 })
    expect(negative.body.error.fields.estimatedCost).toBe('Tahmini maliyet negatif olamaz')
  })

  it('başkasının gezisine ve başka gezinin gününe aktivite eklenemez', async () => {
    const { app } = createTestApp()
    const { trip: ayseTrip } = await tripFor(app, 'ayse@example.com')
    const { agent: ali, trip: aliTrip } = await tripFor(app, 'ali@example.com')

    const foreign = await ali.post(`/api/trips/${ayseTrip.id}/days/${ayseTrip.days[0].id}/activities`).send(colosseum)
    expect(foreign.status).toBe(404)
    // Kendi gezisinin adresiyle başkasının gün id'si
    const mixed = await ali.post(`/api/trips/${aliTrip.id}/days/${ayseTrip.days[0].id}/activities`).send(colosseum)
    expect(mixed.status).toBe(404)
    expect(mixed.body.error.code).toBe('DAY_NOT_FOUND')
  })
})

describe('DELETE /api/trips/:id/activities/:activityId (W-15)', () => {
  it('aktiviteyi siler; başkası silemez', async () => {
    const { app } = createTestApp()
    const { agent, trip } = await tripFor(app, 'ayse@example.com')
    const { agent: ali } = await tripFor(app, 'ali@example.com')
    const { body } = await agent.post(`/api/trips/${trip.id}/days/${trip.days[0].id}/activities`).send(colosseum)
    const url = `/api/trips/${trip.id}/activities/${body.activity.id}`

    expect((await ali.delete(url)).status).toBe(404)
    expect((await agent.delete(url)).status).toBe(204)
    expect((await agent.delete(url)).status).toBe(404)
    expect((await agent.get(`/api/trips/${trip.id}`)).body.trip.days[0].activities).toEqual([])
  })
})
