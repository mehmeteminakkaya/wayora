import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchDuffelFlights } from './duffel.ts'
import { searchTicketmasterEvents } from './ticketmaster.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Ticketmaster Discovery normalizasyonu', () => {
  it('etkinlik, venue ve fiyat alanlarını güvenli biçimde eşler', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            _embedded: {
              events: [
                {
                  id: 'event-1',
                  name: 'Berlin Caz Gecesi',
                  url: 'https://www.ticketmaster.com/event-1',
                  images: [
                    { ratio: '16_9', url: 'https://img.example/event-1.jpg', width: 1024 },
                  ],
                  dates: {
                    start: { localDate: '2026-11-06', localTime: '20:00' },
                    status: { code: 'onsale' },
                  },
                  priceRanges: [{ min: 25, max: 45, currency: 'EUR' }],
                  _embedded: {
                    venues: [{ name: 'Caz Kulübü', city: { name: 'Berlin' } }],
                  },
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const events = await searchTicketmasterEvents({
      apiKey: 'test-key',
      city: 'Berlin',
      startDate: '2026-11-05',
      endDate: '2026-11-08',
      timeoutMs: 1000,
    })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      name: 'Berlin Caz Gecesi',
      startDate: '2026-11-06',
      startTime: '20:00',
      venue: 'Caz Kulübü',
      city: 'Berlin',
      priceMin: 25,
      priceMax: 45,
      currency: 'EUR',
      status: 'onsale',
    })
  })
})

describe('Duffel uçuş normalizasyonu', () => {
  it('test token ile test modunu ve fiyatı döner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              offers: [
                {
                  id: 'off_1',
                  total_amount: '149.90',
                  total_currency: 'EUR',
                  expires_at: '2026-11-01T10:00:00Z',
                  owner: { name: 'Duffel Airways', iata_code: 'ZZ' },
                  slices: [
                    {
                      duration: 'PT2H45M',
                      segments: [
                        {
                          origin: { iata_code: 'IST' },
                          destination: { iata_code: 'BER' },
                          departing_at: '2026-11-05T08:00:00',
                          arriving_at: '2026-11-05T10:45:00',
                          marketing_carrier: { name: 'Duffel Airways' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const result = await searchDuffelFlights({
      token: 'duffel_test_token',
      origin: 'IST',
      destination: 'BER',
      departureDate: '2026-11-05',
      returnDate: '2026-11-08',
      adults: 1,
      cabin: 'economy',
      timeoutMs: 1000,
    })

    expect(result.mode).toBe('test')
    expect(result.offers).toHaveLength(1)
    expect(result.offers[0]).toMatchObject({
      id: 'off_1',
      airline: 'Duffel Airways',
      price: 149.9,
      currency: 'EUR',
      from: 'IST',
      to: 'BER',
      stops: 0,
    })
  })
})
