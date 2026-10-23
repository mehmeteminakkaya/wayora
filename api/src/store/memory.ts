import { randomUUID } from 'node:crypto'
import { EmailTakenError, type Preferences, type Store, type Trip, type User } from './types.ts'

const withoutOwner = ({ userId: _owner, ...trip }: Trip & { userId: string }): Trip => trip

// Testler için bellek içi depo. Prisma deposuyla aynı davranır (benzersiz e-posta dahil).
export function createMemoryStore(): Store {
  const users: User[] = []
  const preferences = new Map<string, Preferences>()
  const trips: (Trip & { userId: string })[] = []

  return {
    users: {
      async findByEmail(email) {
        return users.find((u) => u.email === email) ?? null
      },
      async findById(id) {
        return users.find((u) => u.id === id) ?? null
      },
      async create(data) {
        if (users.some((u) => u.email === data.email)) throw new EmailTakenError()
        const user: User = { id: randomUUID(), createdAt: new Date(), ...data }
        users.push(user)
        return user
      },
    },
    preferences: {
      async get(userId) {
        return preferences.get(userId) ?? null
      },
      async save(userId, data) {
        preferences.set(userId, { ...data })
        return { ...data }
      },
    },
    trips: {
      async create(userId, data, days) {
        const trip = {
          ...data,
          id: randomUUID(),
          userId,
          status: 'DRAFT' as const,
          createdAt: new Date(),
          days: days.map((d) => ({ ...d, id: randomUUID(), notes: null })),
        }
        trips.push(trip)
        return structuredClone(withoutOwner(trip))
      },
      async findForUser(userId, tripId) {
        const trip = trips.find((t) => t.id === tripId && t.userId === userId)
        return trip ? structuredClone(withoutOwner(trip)) : null
      },
      async listForUser(userId) {
        return trips
          .filter((t) => t.userId === userId)
          .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt.getTime() - b.createdAt.getTime())
          .map(({ userId: _owner, days, createdAt: _created, ...t }) => ({ ...t, dayCount: days.length }))
      },
      async deleteForUser(userId, tripId) {
        const index = trips.findIndex((t) => t.id === tripId && t.userId === userId)
        if (index === -1) return false
        trips.splice(index, 1)
        return true
      },
    },
  }
}
