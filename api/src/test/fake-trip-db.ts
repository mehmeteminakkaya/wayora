import { randomUUID } from 'node:crypto'
import type { Db } from '../lib/prisma.ts'

export const TRIP_OWNER_ID = 'user-trip-owner'
export const TRIP_ID = 'trip-1'
export const DAY_ONE_ID = 'day-1'
export const DAY_TWO_ID = 'day-2'

export type FakeExperience = {
  id: string
  googlePlaceId: string
  name: string
  category: string
  address: string | null
  rating: number | null
  tags: string[]
  estimatedCost: number
}

export const FAKE_EXPERIENCES: FakeExperience[] = [
  {
    id: 'exp-louvre',
    googlePlaceId: 'catalog-paris-louvre',
    name: 'Louvre Müzesi',
    category: 'museum',
    address: 'Rue de Rivoli',
    rating: 4.8,
    tags: ['sanat', 'müze'],
    estimatedCost: 22,
  },
  {
    id: 'exp-eiffel',
    googlePlaceId: 'catalog-paris-eiffel',
    name: 'Eyfel Kulesi',
    category: 'landmark',
    address: 'Champ de Mars',
    rating: 4.7,
    tags: ['ikonik'],
    estimatedCost: 35,
  },
  {
    id: 'exp-montmartre',
    googlePlaceId: 'catalog-paris-montmartre',
    name: 'Montmartre',
    category: 'other',
    address: 'Montmartre',
    rating: 4.6,
    tags: ['mahalle'],
    estimatedCost: 0,
  },
]

type StoredPlace = {
  id: string
  googlePlaceId: string
  name: string
  lat: number
  lng: number
  address: string | null
  rating: number | null
  types: string[]
}

type StoredActivity = {
  id: string
  tripDayId: string
  order: number
  title: string
  category: string
  startTime: string | null
  endTime: string | null
  estimatedCost: number | null
  placeId: string | null
  notes: string | null
}

type StoredDay = {
  id: string
  tripId: string
  dayIndex: number
  date: Date
  notes: string | null
}

type StoredTrip = {
  id: string
  userId: string
  title: string
  destination: string
  startDate: Date
  endDate: Date
  budget: number | null
  currency: string
  status: string
  tips: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
  days: StoredDay[]
}

type FakeTripDb = {
  cityExperience: {
    findMany(args: { where: { id: { in: string[] } } }): Promise<FakeExperience[]>
  }
  place: {
    upsert(args: {
      where: { googlePlaceId: string }
      create: Omit<StoredPlace, 'id'>
      update: Partial<StoredPlace>
    }): Promise<StoredPlace>
  }
  trip: {
    findFirst(args: { where: { id: string; userId: string } }): Promise<unknown>
    update(args: { where: { id: string }; data: { status?: string } }): Promise<unknown>
  }
  activity: {
    createMany(args: { data: Array<Omit<StoredActivity, 'id'>> }): Promise<{ count: number }>
    findFirst(args: {
      where: { id: string; tripDay?: { trip?: { userId?: string } } }
    }): Promise<StoredActivity | null>
    update(args: { where: { id: string }; data: Partial<StoredActivity> }): Promise<StoredActivity>
  }
  $transaction<T>(callback: (tx: FakeTripDb) => Promise<T>): Promise<T>
}

/**
 * Gezi günleri + deneyim importu + aktivite PATCH akışı için bellek içi Prisma taklidi.
 * Auth route'ları kullanılmaz; testler oturum çerezini doğrudan imzalar.
 */
export function createFakeTripDb(options: { existingOrders?: number[] } = {}) {
  const trip: StoredTrip = {
    id: TRIP_ID,
    userId: TRIP_OWNER_ID,
    title: 'Paris planı',
    destination: 'Paris',
    startDate: new Date('2026-11-10T00:00:00.000Z'),
    endDate: new Date('2026-11-11T00:00:00.000Z'),
    budget: 500,
    currency: 'EUR',
    status: 'draft',
    tips: [],
    notes: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    days: [
      {
        id: DAY_ONE_ID,
        tripId: TRIP_ID,
        dayIndex: 1,
        date: new Date('2026-11-10T00:00:00.000Z'),
        notes: null,
      },
      {
        id: DAY_TWO_ID,
        tripId: TRIP_ID,
        dayIndex: 2,
        date: new Date('2026-11-11T00:00:00.000Z'),
        notes: null,
      },
    ],
  }

  const activities: StoredActivity[] = (options.existingOrders ?? []).map((order) => ({
    id: `existing-${order}`,
    tripDayId: DAY_ONE_ID,
    order,
    title: `Mevcut aktivite ${order + 1}`,
    category: 'other',
    startTime: null,
    endTime: null,
    estimatedCost: null,
    placeId: null,
    notes: null,
  }))

  const places = new Map<string, StoredPlace>()

  function tripResponse() {
    return {
      ...trip,
      days: trip.days.map((day) => ({
        ...day,
        activities: activities
          .filter((activity) => activity.tripDayId === day.id)
          .sort((a, b) => a.order - b.order)
          .map((activity) => ({
            ...activity,
            place: activity.placeId ? (places.get(activity.placeId) ?? null) : null,
          })),
      })),
    }
  }

  const db: FakeTripDb = {
    cityExperience: {
      async findMany(args) {
        return FAKE_EXPERIENCES.filter((experience) => args.where.id.in.includes(experience.id))
      },
    },
    place: {
      async upsert(args) {
        const existing = [...places.values()].find(
          (place) => place.googlePlaceId === args.where.googlePlaceId,
        )
        if (existing) {
          Object.assign(existing, args.update)
          return existing
        }
        const place: StoredPlace = { id: randomUUID(), ...args.create }
        places.set(place.id, place)
        return place
      },
    },
    trip: {
      async findFirst(args) {
        if (args.where.id !== trip.id || args.where.userId !== trip.userId) return null
        return tripResponse()
      },
      async update(args) {
        if (args.where.id !== trip.id) throw new Error('Gezi bulunamadı')
        if (args.data.status) trip.status = args.data.status
        trip.updatedAt = new Date()
        return tripResponse()
      },
    },
    activity: {
      async createMany(args) {
        for (const data of args.data) {
          activities.push({ id: randomUUID(), ...data })
        }
        return { count: args.data.length }
      },
      async findFirst(args) {
        const activity = activities.find((item) => item.id === args.where.id)
        if (!activity) return null
        const day = trip.days.find((item) => item.id === activity.tripDayId)
        if (!day || day.tripId !== trip.id) return null
        const requestedUserId = args.where.tripDay?.trip?.userId
        if (requestedUserId && requestedUserId !== trip.userId) return null
        return activity
      },
      async update(args) {
        const activity = activities.find((item) => item.id === args.where.id)
        if (!activity) throw new Error('Aktivite bulunamadı')
        Object.assign(activity, args.data)
        return activity
      },
    },
    async $transaction(callback) {
      return callback(db)
    },
  }

  return { db: db as unknown as Db, trip, activities }
}
