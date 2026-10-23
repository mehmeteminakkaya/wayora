import { api } from './client'

export type Currency = 'TRY' | 'EUR' | 'USD'
export type ActivityCategory =
  | 'SIGHTSEEING'
  | 'MUSEUM'
  | 'FOOD'
  | 'NATURE'
  | 'SHOPPING'
  | 'NIGHTLIFE'
  | 'TRANSPORT'
  | 'OTHER'

export type Activity = {
  id: string
  order: number
  title: string
  category: ActivityCategory
  startTime: string | null
  endTime: string | null
  estimatedCost: number | null
  notes: string | null
}

export type NewActivity = Omit<Activity, 'id' | 'order'>

export type TripDay = { id: string; dayIndex: number; date: string; notes: string | null; activities: Activity[] }

export type Trip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number | null
  currency: Currency
  status: 'DRAFT' | 'PLANNED'
  days: TripDay[]
}

export type TripSummary = Omit<Trip, 'days'> & { dayCount: number }

export type NewTrip = {
  destination: string
  title?: string
  startDate: string
  endDate: string
  budget?: number | null
  currency: Currency
}

export const createTrip = (input: NewTrip) =>
  api<{ trip: Trip }>('/api/trips', { method: 'POST', body: input }).then((r) => r.trip)

export const getTrip = (id: string) =>
  api<{ trip: Trip }>(`/api/trips/${encodeURIComponent(id)}`).then((r) => r.trip)

export const listTrips = () => api<{ trips: TripSummary[] }>('/api/trips').then((r) => r.trips)

export const deleteTrip = (id: string) =>
  api<void>(`/api/trips/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const addActivity = (tripId: string, dayId: string, input: NewActivity) =>
  api<{ activity: Activity }>(`/api/trips/${encodeURIComponent(tripId)}/days/${encodeURIComponent(dayId)}/activities`, {
    method: 'POST',
    body: input,
  }).then((r) => r.activity)

export const deleteActivity = (tripId: string, activityId: string) =>
  api<void>(`/api/trips/${encodeURIComponent(tripId)}/activities/${encodeURIComponent(activityId)}`, { method: 'DELETE' })
