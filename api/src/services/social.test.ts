import { describe, expect, it } from 'vitest'
import { overlapDays, scoreCandidate, type SocialContext, type SocialTrip } from './social.ts'

const myTrip: SocialTrip = {
  id: 'trip-1',
  destination: 'Berlin',
  startDate: new Date('2026-11-05T00:00:00.000Z'),
  endDate: new Date('2026-11-08T00:00:00.000Z'),
}

const myContext: SocialContext = {
  interests: ['museum', 'food', 'nature'],
  pace: 'moderate',
  languages: ['tr', 'en'],
}

function candidate(overrides: Partial<Parameters<typeof scoreCandidate>[1]> = {}) {
  return {
    userId: 'user-2',
    displayName: 'Deniz',
    bio: 'Müzeleri ve yerel mutfağı seven sakin bir gezgin.',
    languages: ['tr', 'en'],
    hostingAvailable: true,
    hostingNote: 'Küçük bir misafir odası var.',
    interests: ['museum', 'food'],
    travelStyle: 'balanced',
    pace: 'moderate',
    trips: [
      {
        id: 'trip-2',
        destination: 'Berlin',
        startDate: new Date('2026-11-06T00:00:00.000Z'),
        endDate: new Date('2026-11-10T00:00:00.000Z'),
      },
    ],
    ...overrides,
  }
}

describe('Yol Arkadaşları eşleşme skoru', () => {
  it('tarih kesişimini gün bazında hesaplar', () => {
    expect(overlapDays(myTrip, candidate().trips[0]!)).toBe(3)
    expect(
      overlapDays(myTrip, {
        ...candidate().trips[0]!,
        startDate: new Date('2026-11-20T00:00:00.000Z'),
      }),
    ).toBe(0)
  })

  it('aynı şehir, ortak ilgi ve tempo için açıklanabilir sonuç döner', () => {
    const result = scoreCandidate([myTrip], candidate(), myContext)
    expect(result).not.toBeNull()
    expect(result?.overlapDays).toBe(3)
    expect(result?.sharedInterests).toEqual(['museum', 'food'])
    expect(result?.score).toBeGreaterThanOrEqual(70)
    expect(result?.reasons).toEqual(
      expect.arrayContaining([
        '3 gün aynı şehirde',
        'Ortak ilgi: Müze, Yemek',
        'Benzer seyahat temposu',
        'Ev sahipliğine açık',
      ]),
    )
  })

  it('farklı şehir veya tarih aralığında eşleşme üretmez', () => {
    expect(
      scoreCandidate(
        [myTrip],
        candidate({
          trips: [
            {
              id: 'trip-3',
              destination: 'Paris',
              startDate: new Date('2026-11-05T00:00:00.000Z'),
              endDate: new Date('2026-11-08T00:00:00.000Z'),
            },
          ],
        }),
        myContext,
      ),
    ).toBeNull()

    expect(
      scoreCandidate(
        [myTrip],
        candidate({
          trips: [
            {
              id: 'trip-4',
              destination: 'Berlin',
              startDate: new Date('2026-12-05T00:00:00.000Z'),
              endDate: new Date('2026-12-08T00:00:00.000Z'),
            },
          ],
        }),
        myContext,
      ),
    ).toBeNull()
  })

  it('Türkçe ve İngilizce ilgi adlarını aynı kabul eder', () => {
    const result = scoreCandidate(
      [myTrip],
      candidate({ interests: ['Müze', 'Yemek'] }),
      myContext,
    )
    expect(result?.sharedInterests).toEqual(['museum', 'food'])
    expect(result?.reasons).toContain('Ortak ilgi: Müze, Yemek')
  })

  it('skoru 100 ile sınırlar', () => {
    const result = scoreCandidate([myTrip], candidate(), {
      ...myContext,
      interests: ['museum', 'food', 'nature', 'shopping', 'history'],
    })
    expect(result?.score).toBeLessThanOrEqual(100)
  })
})
