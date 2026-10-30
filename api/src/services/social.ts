import { canonicalInterest, interestLabel } from '../data/interests.ts'
import { normalizeCity } from '../data/city-catalog.ts'

export type SocialTrip = {
  id: string
  destination: string
  startDate: Date
  endDate: Date
}

export type SocialContext = {
  interests: string[]
  pace: string
  languages: string[]
}

export type SocialCandidate = {
  userId: string
  displayName: string
  bio: string
  languages: string[]
  hostingAvailable: boolean
  hostingNote: string | null
  interests: string[]
  travelStyle: string
  pace: string
  trips: SocialTrip[]
}

export type MatchResult = {
  candidate: SocialCandidate
  trip: SocialTrip
  overlapDays: number
  score: number
  sharedInterests: string[]
  reasons: string[]
}

function dayValue(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function overlapDays(a: SocialTrip, b: SocialTrip): number {
  const start = Math.max(dayValue(a.startDate), dayValue(b.startDate))
  const end = Math.min(dayValue(a.endDate), dayValue(b.endDate))
  if (end < start) return 0
  return Math.round((end - start) / 86_400_000) + 1
}

function isSameDestination(a: string, b: string): boolean {
  return normalizeCity(a) === normalizeCity(b)
}

function sharedValues(a: string[], b: string[]): string[] {
  const right = new Set(b.map(canonicalInterest))
  return [...new Set(a.map(canonicalInterest))].filter((value) => right.has(value))
}

export function scoreCandidate(
  myTrips: SocialTrip[],
  candidate: SocialCandidate,
  context: SocialContext,
): MatchResult | null {
  let best: MatchResult | null = null

  for (const myTrip of myTrips) {
    for (const theirTrip of candidate.trips) {
      if (!isSameDestination(myTrip.destination, theirTrip.destination)) continue
      const overlap = overlapDays(myTrip, theirTrip)
      if (overlap === 0) continue

      const sharedInterests = sharedValues(context.interests, candidate.interests)
      const samePace = candidate.pace === context.pace
      const sameLanguage = context.languages.some((language) =>
        candidate.languages
          .map((item) => item.toLocaleLowerCase('tr-TR'))
          .includes(language.toLocaleLowerCase('tr-TR')),
      )

      const score = Math.min(
        100,
        40 +
          Math.min(20, overlap * 4) +
          Math.min(18, sharedInterests.length * 6) +
          (samePace ? 10 : 0) +
          (candidate.hostingAvailable ? 5 : 0) +
          (sameLanguage ? 7 : 0),
      )

      const reasons = [
        `${overlap} gün aynı şehirde`,
        ...(sharedInterests.length > 0
          ? [
              `Ortak ilgi: ${sharedInterests
                .slice(0, 3)
                .map(interestLabel)
                .join(', ')}`,
            ]
          : []),
        ...(samePace ? ['Benzer seyahat temposu'] : []),
        ...(candidate.hostingAvailable ? ['Ev sahipliğine açık'] : []),
      ]

      if (!best || score > best.score) {
        best = { candidate, trip: theirTrip, overlapDays: overlap, score, sharedInterests, reasons }
      }
    }
  }

  return best
}
