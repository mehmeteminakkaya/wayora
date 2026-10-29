import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { createFakeDb } from '../test/fake-db.ts'

const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function appWithoutDiscoveryKeys() {
  return createApp({
    corsOrigin: 'http://localhost:5180',
    checkDb: async () => {},
    db: createFakeDb(),
    config,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('keşif sağlayıcı durumu', () => {
  it('anahtarlar yokken sağlayıcıları missing olarak bildirir', async () => {
    const response = await request(appWithoutDiscoveryKeys()).get('/api/discovery/status')
    expect(response.status).toBe(200)
    expect(response.body.providers).toEqual({ ticketmaster: 'missing', duffel: 'missing' })
  })

  it('Ticketmaster anahtarı yokken uydurma etkinlik döndürmez', async () => {
    const response = await request(appWithoutDiscoveryKeys())
      .get('/api/discovery/events')
      .query({ city: 'Berlin', startDate: '2026-11-05', endDate: '2026-11-08' })

    expect(response.status).toBe(503)
    expect(response.body.error.code).toBe('TICKETMASTER_NOT_CONFIGURED')
  })

  it('anahtar varsa Ticketmaster yanıtını normalize ederek döner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            _embedded: {
              events: [
                {
                  id: 'event-route-1',
                  name: 'Berlin Konseri',
                  url: 'https://www.ticketmaster.com/event-route-1',
                  dates: { start: { localDate: '2026-11-06', localTime: '20:00' } },
                  _embedded: { venues: [{ name: 'Arena', city: { name: 'Berlin' } }] },
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )
    const configured = loadConfig({
      DATABASE_URL: 'postgresql://x',
      NODE_ENV: 'test',
      TICKETMASTER_API_KEY: 'test-key',
    })
    const app = createApp({
      corsOrigin: 'http://localhost:5180',
      checkDb: async () => {},
      db: createFakeDb(),
      config: configured,
    })

    const response = await request(app)
      .get('/api/discovery/events')
      .query({ city: 'Berlin', startDate: '2026-11-05', endDate: '2026-11-08' })

    expect(response.status).toBe(200)
    expect(response.body.provider).toBe('ticketmaster')
    expect(response.body.events[0]).toMatchObject({
      name: 'Berlin Konseri',
      venue: 'Arena',
      startDate: '2026-11-06',
      startTime: '20:00',
    })
  })

  it('uçuş araması oturum istemeden dış servise çağrı yapmaz', async () => {
    const response = await request(appWithoutDiscoveryKeys())
      .get('/api/discovery/flights')
      .query({
        origin: 'IST',
        destination: 'Berlin',
        departureDate: '2026-11-05',
        returnDate: '2026-11-08',
      })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})
