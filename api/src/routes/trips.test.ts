import request from 'supertest'
import type { Response } from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { signSession } from '../lib/jwt.ts'
import { createFakeDb } from '../test/fake-db.ts'
import {
  createFakeTripDb,
  DAY_ONE_ID,
  DAY_TWO_ID,
  TRIP_ID,
  TRIP_OWNER_ID,
} from '../test/fake-trip-db.ts'

const corsOrigin = 'http://localhost:5180'
const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function cookieFrom(response: Response): string {
  const header = response.headers['set-cookie']
  const values = Array.isArray(header) ? header : header ? [header] : []
  return values.map((value) => value.split(';')[0]).join('; ')
}

function sessionFor(userId: string): string {
  const token = signSession(userId, config.JWT_SECRET, config.JWT_EXPIRES_IN)
  return `${config.COOKIE_NAME}=${token}`
}

function appWithTripDb(options: { existingOrders?: number[] } = {}) {
  const fake = createFakeTripDb(options)
  const app = createApp({
    corsOrigin,
    checkDb: async () => {},
    db: fake.db,
    config,
  })
  return { app, ...fake }
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

describe('geziye deneyim ekleme', () => {
  it('oturum ister', async () => {
    const { app } = appWithTripDb()
    const res = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .send({ experienceIds: ['exp-louvre'] })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('boş veya 20 deneyimden uzun listeyi reddeder', async () => {
    const { app } = appWithTripDb()
    const cookie = sessionFor(TRIP_OWNER_ID)

    const empty = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', cookie)
      .send({ experienceIds: [] })
    expect(empty.status).toBe(400)
    expect(empty.body.error.code).toBe('VALIDATION_ERROR')

    const tooMany = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', cookie)
      .send({ experienceIds: Array.from({ length: 21 }, (_, index) => `exp-${index}`) })
    expect(tooMany.status).toBe(400)
    expect(tooMany.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('deneyimleri günlere sırayla dağıtır ve mevcut aktivitelerin ardına ekler', async () => {
    const { app } = appWithTripDb({ existingOrders: [0, 1] })
    const res = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', sessionFor(TRIP_OWNER_ID))
      .send({ experienceIds: ['exp-louvre', 'exp-eiffel', 'exp-montmartre'] })

    expect(res.status).toBe(201)
    expect(res.body.trip.status).toBe('planned')

    const [dayOne, dayTwo] = res.body.trip.days
    expect(dayOne.activities.map((activity: { title: string }) => activity.title)).toEqual([
      'Mevcut aktivite 1',
      'Mevcut aktivite 2',
      'Louvre Müzesi',
      'Montmartre',
    ])
    expect(dayOne.activities.map((activity: { order: number }) => activity.order)).toEqual([
      0, 1, 2, 3,
    ])
    expect(dayTwo.activities).toHaveLength(1)
    expect(dayTwo.activities[0]).toMatchObject({
      title: 'Eyfel Kulesi',
      category: 'landmark',
      order: 0,
      startTime: '09:30',
      endTime: '11:00',
      estimatedCost: 35,
      place: {
        googlePlaceId: 'catalog-paris-eiffel',
        name: 'Eyfel Kulesi',
        address: 'Champ de Mars',
        rating: 4.7,
      },
    })
  })

  it('seçilen deneyimlerle geziyi planlı duruma getirir', async () => {
    const { app } = appWithTripDb()
    const res = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', sessionFor(TRIP_OWNER_ID))
      .send({ experienceIds: ['exp-louvre', 'exp-eiffel'] })

    expect(res.status).toBe(201)
    expect(res.body.trip.status).toBe('planned')
    expect(res.body.trip.days[0].activities.map((activity: { title: string }) => activity.title)).toEqual([
      'Louvre Müzesi',
    ])
    expect(res.body.trip.days[1].activities.map((activity: { title: string }) => activity.title)).toEqual([
      'Eyfel Kulesi',
    ])
  })

  it('başka kullanıcının gezisi veya bilinmeyen deneyim için 404 döner', async () => {
    const { app } = appWithTripDb()

    const foreign = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', sessionFor('baska-kullanici'))
      .send({ experienceIds: ['exp-louvre'] })
    expect(foreign.status).toBe(404)
    expect(foreign.body.error.code).toBe('NOT_FOUND')

    const missingExperience = await request(app)
      .post(`/api/trips/${TRIP_ID}/experiences`)
      .set('Cookie', sessionFor(TRIP_OWNER_ID))
      .send({ experienceIds: ['exp-louvre', 'exp-yok'] })
    expect(missingExperience.status).toBe(404)
    expect(missingExperience.body.error.code).toBe('EXPERIENCE_NOT_FOUND')
  })
})

describe('aktivite sırası güncelleme', () => {
  it('negatif olmayan tam sayı sırayı kabul eder', async () => {
    const { app } = appWithTripDb({ existingOrders: [0, 1] })
    const res = await request(app)
      .patch('/api/activities/existing-0')
      .set('Cookie', sessionFor(TRIP_OWNER_ID))
      .send({ order: 5 })

    expect(res.status).toBe(200)
    expect(res.body.activity).toMatchObject({ id: 'existing-0', order: 5 })
  })

  it('negatif ve ondalık sırayı reddeder', async () => {
    const { app } = appWithTripDb({ existingOrders: [0] })
    const cookie = sessionFor(TRIP_OWNER_ID)

    const negative = await request(app)
      .patch('/api/activities/existing-0')
      .set('Cookie', cookie)
      .send({ order: -1 })
    expect(negative.status).toBe(400)
    expect(negative.body.error.code).toBe('VALIDATION_ERROR')

    const decimal = await request(app)
      .patch('/api/activities/existing-0')
      .set('Cookie', cookie)
      .send({ order: 1.5 })
    expect(decimal.status).toBe(400)
    expect(decimal.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('gün ve aktivite kimliğini değiştirmez', async () => {
    const { app, activities } = appWithTripDb({ existingOrders: [0] })
    const res = await request(app)
      .patch('/api/activities/existing-0')
      .set('Cookie', sessionFor(TRIP_OWNER_ID))
      .send({ order: 3, id: 'baska-aktivite', tripDayId: DAY_TWO_ID })

    expect(res.status).toBe(200)
    expect(res.body.activity).toMatchObject({
      id: 'existing-0',
      tripDayId: DAY_ONE_ID,
      order: 3,
    })
    expect(activities[0]).toMatchObject({
      id: 'existing-0',
      tripDayId: DAY_ONE_ID,
      order: 3,
    })
  })

  it('başka kullanıcının aktivitesini güncellemez', async () => {
    const { app } = appWithTripDb({ existingOrders: [0] })
    const res = await request(app)
      .patch('/api/activities/existing-0')
      .set('Cookie', sessionFor('baska-kullanici'))
      .send({ order: 1 })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
