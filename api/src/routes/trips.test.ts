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

function appWithTripDb(options: Parameters<typeof createFakeTripDb>[0] = {}) {
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

describe('W-36-T-1 gezi takvim dışa aktarma', () => {
  const calendarUrl = `/api/trips/${TRIP_ID}/calendar.ics`
  const seeded = {
    activities: [
      { id: 'act-louvre', tripDayId: DAY_ONE_ID, order: 0, title: 'Louvre', startTime: '09:00', endTime: '11:30' },
      { id: 'act-walk', tripDayId: DAY_ONE_ID, order: 1, title: 'Seine yürüyüşü' },
      { id: 'act-dinner', tripDayId: DAY_TWO_ID, order: 0, title: 'Akşam yemeği; şarap, peynir\nve tatlı', startTime: '19:00' },
    ],
  }

  function vevents(body: string): string[] {
    return body.split('BEGIN:VEVENT').slice(1).map((chunk) => chunk.split('END:VEVENT')[0]!)
  }

  it('W-36-T-1 requires a session and hides other users trips', async () => {
    const { app } = appWithTripDb(seeded)
    const anonymous = await request(app).get(calendarUrl)
    expect(anonymous.status).toBe(401)

    const stranger = await request(app).get(calendarUrl).set('Cookie', sessionFor('someone-else'))
    expect(stranger.status).toBe(404)
    expect(stranger.body.error.code).toBe('NOT_FOUND')
  })

  it('W-36-T-1 returns a calendar attachment named after the trip', async () => {
    const { app } = appWithTripDb(seeded)
    const response = await request(app).get(calendarUrl).set('Cookie', sessionFor(TRIP_OWNER_ID))
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toBe('text/calendar; charset=utf-8')
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="wayora-paris-2026-11-10.ics"',
    )
    expect(response.text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(response.text.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('W-36-T-1 writes one timed VEVENT per activity on its day', async () => {
    const { app } = appWithTripDb(seeded)
    const response = await request(app).get(calendarUrl).set('Cookie', sessionFor(TRIP_OWNER_ID))
    const events = vevents(response.text)
    expect(events).toHaveLength(3)
    expect(events[0]).toContain('UID:act-louvre@wayora')
    expect(events[0]).toContain('SUMMARY:Louvre')
    expect(events[0]).toContain('DTSTART:20261110T090000')
    expect(events[0]).toContain('DTEND:20261110T113000')
    // Start without an end time lasts one hour, on day two's date.
    expect(events[2]).toContain('DTSTART:20261111T190000')
    expect(events[2]).toContain('DTEND:20261111T200000')
  })

  it('W-36-T-1 turns an activity without a start time into an all-day event', async () => {
    const { app } = appWithTripDb(seeded)
    const response = await request(app).get(calendarUrl).set('Cookie', sessionFor(TRIP_OWNER_ID))
    const walk = vevents(response.text)[1]!
    expect(walk).toContain('DTSTART;VALUE=DATE:20261110')
    expect(walk).toContain('DTEND;VALUE=DATE:20261111')
    expect(walk).not.toMatch(/DTSTART:\d/)
  })

  it('W-36-T-1 escapes text and ends every line with CRLF', async () => {
    const { app } = appWithTripDb(seeded)
    const response = await request(app).get(calendarUrl).set('Cookie', sessionFor(TRIP_OWNER_ID))
    // RFC 5545 escaping: "\;" "\," and a literal backslash-n for the line break.
    expect(response.text).toContain('SUMMARY:Akşam yemeği\\; şarap\\, peynir\\nve tatlı')
    const body = response.text
    expect(body.endsWith('\r\n')).toBe(true)
    // After removing every CRLF there must be no bare LF or CR left.
    expect(/[\r\n]/.test(body.replace(/\r\n/g, ''))).toBe(false)
  })
})
