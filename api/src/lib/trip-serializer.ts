import { toDateOnly, toNumber } from './serialize.ts'

export type TripRecord = {
  id: string
  title: string
  destination: string
  startDate: Date
  endDate: Date
  budget: unknown
  currency: string
  status: string
  tips: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
  days: Array<{
    id: string
    dayIndex: number
    date: Date
    notes: string | null
    activities: Array<{
      id: string
      order: number
      title: string
      category: string
      startTime: string | null
      endTime: string | null
      estimatedCost: unknown
      notes: string | null
      place: {
        id: string
        googlePlaceId: string
        name: string
        lat: number
        lng: number
        address: string | null
        rating: number | null
      } | null
    }>
  }>
}

export function serializeTrip(trip: TripRecord) {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    startDate: toDateOnly(trip.startDate),
    endDate: toDateOnly(trip.endDate),
    budget: toNumber(trip.budget),
    currency: trip.currency,
    status: trip.status,
    tips: trip.tips,
    notes: trip.notes,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    days: trip.days.map((day) => ({
      id: day.id,
      dayIndex: day.dayIndex,
      date: toDateOnly(day.date),
      notes: day.notes,
      activities: day.activities.map((activity) => ({
        id: activity.id,
        order: activity.order,
        title: activity.title,
        category: activity.category,
        startTime: activity.startTime,
        endTime: activity.endTime,
        estimatedCost: toNumber(activity.estimatedCost),
        notes: activity.notes,
        place: activity.place
          ? {
              id: activity.place.id,
              googlePlaceId: activity.place.googlePlaceId,
              name: activity.place.name,
              lat: activity.place.lat,
              lng: activity.place.lng,
              address: activity.place.address,
              rating: activity.place.rating,
            }
          : null,
      })),
    })),
  }
}

export type SerializedTrip = ReturnType<typeof serializeTrip>
