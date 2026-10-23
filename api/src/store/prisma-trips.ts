import { toDate, toDay } from '../lib/dates.ts'
import type { Db } from '../lib/prisma.ts'
import type { Trip, TripStore } from './types.ts'

const tripInclude = { days: { orderBy: { dayIndex: 'asc' } } } as const

type Row = NonNullable<Awaited<ReturnType<Db['trip']['findFirst']>>> & {
  days: { id: string; dayIndex: number; date: Date; notes: string | null }[]
}

// Prisma'nın Date alanlarını API'nin 'YYYY-MM-DD' biçimine çevirir
function toTrip({ userId: _owner, updatedAt: _updated, days, ...row }: Row): Trip {
  return {
    ...row,
    startDate: toDay(row.startDate),
    endDate: toDay(row.endDate),
    days: days.map((d) => ({ ...d, date: toDay(d.date) })),
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
  }
}
