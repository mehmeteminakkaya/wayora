// Prod'da VITE_API_URL ile ayrı bir API adresi verilebilir; dev'de Vite proxy kullanılır.
const API_URL = import.meta.env.VITE_API_URL ?? ''

export type Health = { status: 'ok'; db: 'ok' | 'error' }

export type User = { id: string; email: string; name: string | null }

export type BudgetLevel = 'low' | 'mid' | 'high'
export type TravelStyle = 'relaxed' | 'balanced' | 'packed'
export type Pace = 'slow' | 'moderate' | 'fast'
export type ActivityCategory = 'museum' | 'food' | 'nature' | 'landmark' | 'shopping' | 'other'
export type TripStatus = 'draft' | 'generating' | 'planned' | 'failed'

export type Preference = {
  id: string
  interests: string[]
  budgetLevel: BudgetLevel
  travelStyle: TravelStyle
  pace: Pace
  updatedAt: string
}

export type PreferenceInput = Omit<Preference, 'id' | 'updatedAt'>

export type PlaceRef = {
  id: string
  googlePlaceId: string
  name: string
  lat: number
  lng: number
  address: string | null
  rating: number | null
}

export type Activity = {
  id: string
  order: number
  title: string
  category: ActivityCategory
  startTime: string | null
  endTime: string | null
  estimatedCost: number | null
  notes: string | null
  place: PlaceRef | null
}

export type TripDay = {
  id: string
  dayIndex: number
  date: string
  notes: string | null
  activities: Activity[]
}

export type Trip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number | null
  currency: string
  status: TripStatus
  tips: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
  days: TripDay[]
}

export type GenerationMeta = {
  provider: 'offline' | 'gemini' | 'openai' | 'deepseek'
  model: string
  fallback: boolean
  latencyMs: number
  webSearch?: boolean
}

export type DiscoveryStatus = {
  providers: {
    ticketmaster: 'configured' | 'missing'
    duffel: 'configured' | 'missing'
  }
}

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
  provider: 'duffel'
  origin: string
  destination: string
  disclaimer: string
}

export type SocialProfile = {
  displayName: string
  bio: string
  languages: string[]
  hostingAvailable: boolean
  hostingNote: string | null
  visible: boolean
  safetyAccepted: boolean
}

export type SocialProfileInput = {
  displayName: string
  bio: string
  languages: string[]
  hostingAvailable: boolean
  hostingNote: string | null
  visible: boolean
  safetyAccepted: boolean
}

export type SocialPreferences = {
  interests: string[]
  pace: Pace
  budgetLevel: BudgetLevel
  travelStyle: TravelStyle
}

export type SocialMatch = {
  userId: string
  displayName: string
  bio: string
  languages: string[]
  interests: string[]
  pace: Pace
  travelStyle: TravelStyle
  hostingAvailable: boolean
  hostingNote: string | null
  destination: string
  startDate: string
  endDate: string
  overlapDays: number
  score: number
  sharedInterests: string[]
  reasons: string[]
}

export type SocialConnection = {
  id: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  message: string | null
  createdAt: string
  direction: 'incoming' | 'outgoing'
  other: { id: string; name: string }
}

export type SocialConnections = {
  incoming: SocialConnection[]
  outgoing: SocialConnection[]
  accepted: SocialConnection[]
}

export type SocialMessage = {
  id: string
  body: string
  senderId: string
  senderName: string
  mine: boolean
  createdAt: string
}

export type CitySummary = {
  slug: string
  name: string
  country: string
  summary: string
  bestSeason: string | null
  currency: string
  experienceCount: number
  averageCost: number
  averageDailyCost: number
  minCost: number
  tags: string[]
}

export type CityExperience = {
  id: string
  slug: string
  googlePlaceId: string
  name: string
  category: ActivityCategory
  neighborhood: string | null
  address: string | null
  rating: number | null
  durationMinutes: number
  estimatedCost: number
  currency: string
  priceNote: string | null
  description: string
  tags: string[]
  openingHours: string | null
  bookingUrl: string | null
}

export type CityDetail = CitySummary & {
  experiences: CityExperience[]
}

export type CitySearchExperience = CityExperience & {
  citySlug: string
  cityName: string
}

export type CitySearchResult = {
  cities: CitySummary[]
  experiences: CitySearchExperience[]
}

export type CreateTripInput = {
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number | null
  currency: string
  notes: string | null
}

export type CreateActivityInput = {
  title: string
  category: ActivityCategory
  startTime: string | null
  endTime: string | null
  estimatedCost: number | null
  notes: string | null
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (res.status === 204) return undefined as T

  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `İstek başarısız (${res.status})`,
    )
  }
  return body as T
}

export const api = {
  getHealth: () => request<Health>('/api/health'),

  listCities: () => request<{ cities: CitySummary[] }>('/api/cities'),

  getCity: (slug: string) =>
    request<{ city: CityDetail }>(`/api/cities/${encodeURIComponent(slug)}`),

  searchCities: (query: string) =>
    request<CitySearchResult>(`/api/cities/search?q=${encodeURIComponent(query)}`),

  register: (input: { email: string; password: string; name?: string }) =>
    request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/api/auth/me'),

  getPreferences: () => request<{ preference: Preference }>('/api/me/preferences'),

  savePreferences: (input: PreferenceInput) =>
    request<{ preference: Preference }>('/api/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  listTrips: () => request<{ trips: Trip[] }>('/api/trips'),

  getTrip: (id: string) => request<{ trip: Trip }>(`/api/trips/${id}`),

  createTrip: (input: CreateTripInput) =>
    request<{ trip: Trip }>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteTrip: (id: string) => request<void>(`/api/trips/${id}`, { method: 'DELETE' }),

  generateTrip: (id: string) =>
    request<{ trip: Trip; meta: GenerationMeta }>(`/api/trips/${id}/generate`, {
      method: 'POST',
    }),

  importExperiences: (tripId: string, experienceIds: string[]) =>
    request<{ trip: Trip }>(`/api/trips/${tripId}/experiences`, {
      method: 'POST',
      body: JSON.stringify({ experienceIds }),
    }),

  reorderActivity: (
    id: string,
    order: number,
    times?: { startTime: string | null; endTime: string | null },
  ) =>
    request<{ activity: Activity }>(`/api/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ order, ...times }),
    }),

  addActivity: (tripId: string, dayId: string, input: CreateActivityInput) =>
    request<{ activity: Activity }>(`/api/trips/${tripId}/days/${dayId}/activities`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteActivity: (id: string) => request<void>(`/api/activities/${id}`, { method: 'DELETE' }),

  getDiscoveryStatus: () => request<DiscoveryStatus>('/api/discovery/status'),

  listEvents: (city: string, startDate: string, endDate: string) => {
    const params = new URLSearchParams({ city, startDate, endDate })
    return request<{ events: EventOffer[]; provider: 'ticketmaster' }>(
      `/api/discovery/events?${params.toString()}`,
    )
  },

  searchFlights: (input: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    adults?: number
  }) => {
    const params = new URLSearchParams({
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
    })
    if (input.returnDate) params.set('returnDate', input.returnDate)
    if (input.adults) params.set('adults', String(input.adults))
    return request<FlightSearchResult>(`/api/discovery/flights?${params.toString()}`)
  },

  getSocialProfile: () =>
    request<{ profile: SocialProfile | null; preferences: SocialPreferences | null }>(
      '/api/social/profile',
    ),

  saveSocialProfile: (input: SocialProfileInput) =>
    request<{ profile: SocialProfile }>('/api/social/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  getSocialMatches: (offset = 0, limit = 20) =>
    request<{
      matches: SocialMatch[]
      total?: number
      offset?: number
      limit?: number
      reason?: string
    }>(`/api/social/matches?offset=${offset}&limit=${limit}`),

  sendSocialRequest: (recipientId: string, message?: string) =>
    request<{ connection: SocialConnection }>('/api/social/requests', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message: message?.trim() || undefined }),
    }),

  getSocialConnections: () => request<SocialConnections>('/api/social/connections'),

  updateSocialConnection: (id: string, action: 'accept' | 'decline' | 'cancel') =>
    request<{ connection: SocialConnection }>(`/api/social/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),

  getSocialMessages: (connectionId: string) =>
    request<{ messages: SocialMessage[] }>(`/api/social/connections/${connectionId}/messages`),

  sendSocialMessage: (connectionId: string, body: string) =>
    request<{ message: SocialMessage }>(`/api/social/connections/${connectionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  reportSocialConnection: (
    connectionId: string,
    reason: 'harassment' | 'spam' | 'safety' | 'other',
    details?: string,
  ) =>
    request<{ ok: boolean; message: string }>(`/api/social/connections/${connectionId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),

  blockSocialUser: (userId: string) =>
    request<{ ok: boolean }>('/api/social/block', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
}
