import { z } from 'zod'
import { HttpError } from '../middleware/error.ts'

const DUFFEL_ENDPOINT = 'https://api.duffel.com/air/offer_requests?return_offers=true'
const cache = new Map<string, { expiresAt: number; result: FlightSearchResult }>()
const CACHE_TTL_MS = 5 * 60 * 1000

/** Keşif kataloğundaki şehirleri havalimanı kodlarına bağlar. */
export const CITY_AIRPORTS: Record<string, string> = {
  istanbul: 'IST',
  paris: 'CDG',
  roma: 'FCO',
  barcelona: 'BCN',
  londra: 'LHR',
  amsterdam: 'AMS',
  berlin: 'BER',
  prag: 'PRG',
  viyana: 'VIE',
  lizbon: 'LIS',
}

const segmentSchema = z
  .object({
    origin: z.object({ iata_code: z.string() }).passthrough().optional(),
    destination: z.object({ iata_code: z.string() }).passthrough().optional(),
    departing_at: z.string().optional(),
    arriving_at: z.string().optional(),
    marketing_carrier: z.object({ name: z.string() }).passthrough().optional(),
    operating_carrier: z.object({ name: z.string() }).passthrough().optional(),
    duration: z.string().optional(),
  })
  .passthrough()

const offerSchema = z
  .object({
    id: z.string(),
    total_amount: z.string(),
    total_currency: z.string(),
    expires_at: z.string().optional(),
    owner: z
      .object({
        name: z.string().optional(),
        iata_code: z.string().optional(),
      })
      .passthrough()
      .optional(),
    slices: z.array(
      z
        .object({
          segments: z.array(segmentSchema).min(1),
          duration: z.string().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough()

const responseSchema = z
  .object({
    data: z
      .object({
        offers: z.array(offerSchema).optional(),
      })
      .passthrough(),
  })
  .passthrough()

export type FlightOffer = {
  id: string
  airline: string | null
  airlineCode: string | null
  price: number
  currency: string
  expiresAt: string | null
  duration: string | null
  stops: number
  from: string | null
  to: string | null
  departureAt: string | null
  arrivalAt: string | null
}

export type FlightSearchResult = {
  mode: 'test' | 'live'
  offers: FlightOffer[]
}

function normalizeAirport(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR')
}

export function resolveAirportCode(value: string): string | null {
  const normalized = normalizeAirport(value)
  if (CITY_AIRPORTS[normalized]) return CITY_AIRPORTS[normalized]
  const upper = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(upper) ? upper : null
}

type SearchDuffelInput = {
  token: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  cabin: 'economy' | 'premium_economy' | 'business' | 'first'
  timeoutMs: number
}

/**
 * Duffel test token'ı ile canlı olmayan, etiketlenmiş uçuş teklifleri döner.
 * Test fiyatları gerçek değildir; üretimde `mode: live` ve rezervasyon akışı
 * ayrıca ele alınmalıdır.
 */
export async function searchDuffelFlights({
  token,
  origin,
  destination,
  departureDate,
  returnDate,
  adults,
  cabin,
  timeoutMs,
}: SearchDuffelInput): Promise<FlightSearchResult> {
  const mode = token.startsWith('duffel_test_') ? 'test' : 'live'
  const cacheKey = [mode, origin, destination, departureDate, returnDate ?? '', adults, cabin].join('|')
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.result

  const slices = [
    { origin, destination, departure_date: departureDate },
    ...(returnDate ? [{ origin: destination, destination: origin, departure_date: returnDate }] : []),
  ]

  let response: Response
  try {
    response = await fetch(DUFFEL_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'duffel-version': 'v2',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: Array.from({ length: adults }, () => ({ type: 'adult' })),
          cabin_class: cabin,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new HttpError(
      502,
      'DUFFEL_UNAVAILABLE',
      'Uçuş servisine şu anda ulaşılamıyor. Biraz sonra tekrar dene.',
    )
  }

  if (!response.ok) {
    throw new HttpError(
      502,
      'DUFFEL_UNAVAILABLE',
      response.status === 429
        ? 'Uçuş servisi istek limitine ulaştı. Biraz sonra tekrar dene.'
        : 'Uçuş servisi şu anda yanıt vermiyor.',
    )
  }

  const parsed = responseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    throw new HttpError(502, 'DUFFEL_UNAVAILABLE', 'Uçuş servisi geçerli bir yanıt vermedi.')
  }

  const offers: FlightOffer[] = (parsed.data.data.offers ?? [])
    .map((offer) => {
      const firstSlice = offer.slices[0]
      const firstSegment = firstSlice?.segments[0]
      const lastSlice = offer.slices.at(-1)
      const lastSegment = lastSlice?.segments.at(-1)
      return {
        id: offer.id,
        airline: firstSegment?.marketing_carrier?.name ?? offer.owner?.name ?? null,
        airlineCode: offer.owner?.iata_code ?? null,
        price: Number(offer.total_amount),
        currency: offer.total_currency,
        expiresAt: offer.expires_at ?? null,
        duration: firstSlice?.duration ?? null,
        stops: Math.max(0, (firstSlice?.segments.length ?? 1) - 1),
        from: firstSegment?.origin?.iata_code ?? origin,
        to: lastSegment?.destination?.iata_code ?? destination,
        departureAt: firstSegment?.departing_at ?? null,
        arrivalAt: lastSegment?.arriving_at ?? null,
      }
    })
    .filter((offer) => Number.isFinite(offer.price))
    .sort((a, b) => a.price - b.price)
    .slice(0, 6)

  const result: FlightSearchResult = { mode, offers }
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result })
  return result
}
