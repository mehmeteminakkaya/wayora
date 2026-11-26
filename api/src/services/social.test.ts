import { describe, expect, it } from 'vitest'
import { overlapDays, scoreCandidate, type SocialContext, type SocialTrip } from './social.ts'

const myTrip: SocialTrip = {
  id: 'trip-1',
  destination: 'Berlin',
  startDate: new Date('2026-11-05T00:00:00.000Z'),
  endDate: new Date('2026-11-08T00:00:00.000Z'),
}

// Existing tests use November 2026 trips; pin "today" before them so they do not depend on the clock.
const BEFORE_TRIPS = new Date('2026-11-01T12:00:00.000Z')

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
    const result = scoreCandidate([myTrip], candidate(), myContext, BEFORE_TRIPS)
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
        BEFORE_TRIPS,
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
        BEFORE_TRIPS,
      ),
    ).toBeNull()
  })

  it('Türkçe ve İngilizce ilgi adlarını aynı kabul eder', () => {
    const result = scoreCandidate(
      [myTrip],
      candidate({ interests: ['Müze', 'Yemek'] }),
      myContext,
      BEFORE_TRIPS,
    )
    expect(result?.sharedInterests).toEqual(['museum', 'food'])
    expect(result?.reasons).toContain('Ortak ilgi: Müze, Yemek')
  })

  it('skoru 100 ile sınırlar', () => {
    const result = scoreCandidate([myTrip], candidate(), {
      ...myContext,
      interests: ['museum', 'food', 'nature', 'shopping', 'history'],
    }, BEFORE_TRIPS)
    expect(result?.score).toBeLessThanOrEqual(100)
  })
})

describe('W-35-T-1 bitmiş geziler eşleşmeye girmez', () => {
  // myTrip: Berlin 5-8 Kasım; candidate(): Berlin 6-10 Kasım (3 ortak gün).
  it('W-35-T-1 rejects a candidate trip that ended before today', () => {
    const myUpcoming: SocialTrip = { ...myTrip, endDate: new Date('2026-11-20T00:00:00.000Z') }
    // Candidate trip ends 10 Kasım; today is 11 Kasım. Mine is still running.
    expect(
      scoreCandidate([myUpcoming], candidate(), myContext, new Date('2026-11-11T09:00:00.000Z')),
    ).toBeNull()
  })

  it("W-35-T-1 rejects a match when the user's own trip ended before today", () => {
    const theirLong = candidate({
      trips: [{ ...candidate().trips[0]!, endDate: new Date('2026-11-20T00:00:00.000Z') }],
    })
    // My trip ends 8 Kasım; today is 9 Kasım. The candidate's trip is still running.
    expect(
      scoreCandidate([myTrip], theirLong, myContext, new Date('2026-11-09T00:30:00.000Z')),
    ).toBeNull()
  })

  it('W-35-T-1 still matches a trip whose last day is today', () => {
    // Both trips are still active on 8 Kasım (my last day), late in the UTC day.
    const result = scoreCandidate(
      [myTrip],
      candidate(),
      myContext,
      new Date('2026-11-08T23:59:00.000Z'),
    )
    expect(result).not.toBeNull()
    expect(result?.overlapDays).toBe(3)
  })

  it('W-35-T-1 keeps the same result for upcoming trips', () => {
    const before = scoreCandidate([myTrip], candidate(), myContext, BEFORE_TRIPS)
    const dayBefore = scoreCandidate(
      [myTrip],
      candidate(),
      myContext,
      new Date('2026-11-04T18:00:00.000Z'),
    )
    expect(dayBefore).toEqual(before)
    expect(dayBefore?.score).toBeGreaterThanOrEqual(70)
    expect(dayBefore?.reasons).toContain('3 gün aynı şehirde')
  })
})
