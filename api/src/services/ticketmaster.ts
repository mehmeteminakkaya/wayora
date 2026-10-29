import { z } from 'zod'
import { HttpError } from '../middleware/error.ts'

const TICKETMASTER_ENDPOINT = 'https://app.ticketmaster.com/discovery/v2/events.json'
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { expiresAt: number; events: EventOffer[] }>()

const eventSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string().url().optional(),
    images: z
      .array(
        z
          .object({
            ratio: z.string().optional(),
            url: z.string(),
            width: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    dates: z
      .object({
        start: z
          .object({
            localDate: z.string().optional(),
            localTime: z.string().optional(),
            dateTime: z.string().optional(),
          })
          .optional(),
        status: z.object({ code: z.string().optional() }).passthrough().optional(),
      })
      .passthrough()
      .optional(),
    priceRanges: z
      .array(
        z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
            currency: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    _embedded: z
      .object({
        venues: z
          .array(
            z
              .object({
                name: z.string(),
                city: z.object({ name: z.string() }).passthrough().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const responseSchema = z
  .object({
    _embedded: z.object({ events: z.array(eventSchema).optional() }).passthrough().optional(),
  })
  .passthrough()

export type EventOffer = {
  id: string
  name: string
  url: string | null
  imageUrl: string | null
  startDate: string | null
  startTime: string | null
  venue: string | null
  city: string | null
  priceMin: number | null
  priceMax: number | null
  currency: string | null
  status: string | null
}

function pickImage(
  images: Array<{ ratio?: string; url: string; width?: number }> | undefined,
): string | null {
  if (!images || images.length === 0) return null
  const wide = images
    .filter((image) => image.ratio === '16_9')
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  return wide[0]?.url ?? images[0]?.url ?? null
}

function normalizeEvent(event: z.infer<typeof eventSchema>): EventOffer {
  const venue = event._embedded?.venues?.[0]
  const price = event.priceRanges?.[0]
  return {
    id: event.id,
    name: event.name,
    url: event.url ?? null,
    imageUrl: pickImage(event.images),
    startDate: event.dates?.start?.localDate ?? event.dates?.start?.dateTime ?? null,
    startTime: event.dates?.start?.localTime ?? null,
    venue: venue?.name ?? null,
    city: venue?.city?.name ?? null,
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    currency: price?.currency ?? null,
    status: event.dates?.status?.code ?? null,
  }
}

type SearchTicketmasterInput = {
  apiKey: string
  city: string
  startDate: string
  endDate: string
  timeoutMs: number
}

/**
 * Ticketmaster Discovery yalnızca etkinlik keşfi içindir. Bilet fiyatı ve
 * müsaitliği her etkinlikte bulunmayabilir; bu yüzden eksik alanlar null döner.
 */
export async function searchTicketmasterEvents({
  apiKey,
  city,
  startDate,
  endDate,
  timeoutMs,
}: SearchTicketmasterInput): Promise<EventOffer[]> {
  const cacheKey = [city, startDate, endDate].join('|')
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.events

  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '6',
    sort: 'date,asc',
    locale: 'en',
  })

  let response: Response
  try {
    response = await fetch(`${TICKETMASTER_ENDPOINT}?${params.toString()}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new HttpError(
      502,
      'TICKETMASTER_UNAVAILABLE',
      'Etkinlik servisine şu anda ulaşılamıyor. Biraz sonra tekrar dene.',
    )
  }

  if (!response.ok) {
    throw new HttpError(
      502,
      'TICKETMASTER_UNAVAILABLE',
      response.status === 429
        ? 'Etkinlik servisi istek limitine ulaştı. Biraz sonra tekrar dene.'
        : 'Etkinlik servisi şu anda yanıt vermiyor.',
    )
  }

  const parsed = responseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    throw new HttpError(502, 'TICKETMASTER_UNAVAILABLE', 'Etkinlik servisi geçerli bir yanıt vermedi.')
  }

  const events = (parsed.data._embedded?.events ?? []).map(normalizeEvent)
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, events })
  return events
}
