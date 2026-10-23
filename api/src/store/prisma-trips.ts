import { toDate, toDay } from '../lib/dates.ts'
import type { Db } from '../lib/prisma.ts'
import type { Activity, Trip, TripStore } from './types.ts'

const activitySelect = {
  id: true,
  order: true,
  title: true,
  category: true,
  startTime: true,
  endTime: true,
  estimatedCost: true,
  notes: true,
} as const

const tripInclude = {
  days: {
    orderBy: { dayIndex: 'asc' },
    include: { activities: { orderBy: { order: 'asc' }, select: activitySelect } },
  },
} as const

type Row = NonNullable<Awaited<ReturnType<Db['trip']['findFirst']>>> & {
  days: { id: string; dayIndex: number; date: Date; notes: string | null; activities: Activity[] }[]
}

// Prisma'nın Date alanlarını API'nin 'YYYY-MM-DD' biçimine çevirir
function toTrip({ userId: _owner, updatedAt: _updated, days, ...row }: Row): Trip {
  return {
    ...row,
    startDate: toDay(row.startDate),
    endDate: toDay(row.endDate),
    days: days.map(({ tripId: _trip, ...d }: Row['days'][number] & { tripId?: string }) => ({
      ...d,
      date: toDay(d.date),
    })),
  }
}

export function createPrismaTripStore(db: Db): TripStore {
  return {
    async create(userId, data, days) {
      const row = await db.trip.create({
        data: {
          ...data,
          userId,
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
          days: { create: days.map((d) => ({ dayIndex: d.dayIndex, date: toDate(d.date) })) },
        },
        include: tripInclude,
      })
      return toTrip(row)
    },
    async findForUser(userId, tripId) {
      const row = await db.trip.findFirst({ where: { id: tripId, userId }, include: tripInclude })
      return row ? toTrip(row) : null
    },
    async listForUser(userId) {
      const rows = await db.trip.findMany({
        where: { userId },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { days: true } } },
      })
      return rows.map(({ userId: _owner, updatedAt: _updated, createdAt: _created, _count, ...row }) => ({
        ...row,
        startDate: toDay(row.startDate),
        endDate: toDay(row.endDate),
        dayCount: _count.days,
      }))
    },
    async deleteForUser(userId, tripId) {
      // Günler (ve W-15'te aktiviteler) veritabanında onDelete: Cascade ile silinir
      const { count } = await db.trip.deleteMany({ where: { id: tripId, userId } })
      return count > 0
    },
    async addActivity(userId, tripId, dayId, data) {
      // Gün hem bu geziye hem de gezi bu kullanıcıya ait olmalı
      const day = await db.tripDay.findFirst({ where: { id: dayId, trip: { id: tripId, userId } } })
      if (!day) return null
      const last = await db.activity.aggregate({ where: { tripDayId: dayId }, _max: { order: true } })
      return db.activity.create({
        data: { ...data, tripDayId: dayId, order: (last._max.order ?? 0) + 1 },
        select: activitySelect,
      })
    },
    async deleteActivity(userId, tripId, activityId) {
      const { count } = await db.activity.deleteMany({
        where: { id: activityId, tripDay: { trip: { id: tripId, userId } } },
      })
      return count > 0
    },
  }
}
