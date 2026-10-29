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
  provider: 'offline' | 'gemini' | 'openai'
  model: string
  fallback: boolean
  latencyMs: number
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

  addActivity: (tripId: string, dayId: string, input: CreateActivityInput) =>
    request<{ activity: Activity }>(`/api/trips/${tripId}/days/${dayId}/activities`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteActivity: (id: string) => request<void>(`/api/activities/${id}`, { method: 'DELETE' }),
}
