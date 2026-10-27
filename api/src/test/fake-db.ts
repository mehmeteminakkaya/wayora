import { randomUUID } from 'node:crypto'
import type { Db } from '../lib/prisma.ts'

type StoredUser = {
  id: string
  email: string
  passwordHash: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

type StoredPreference = {
  id: string
  userId: string
  interests: string[]
  budgetLevel: string
  travelStyle: string
  pace: string
  updatedAt: Date
}

class UniqueConstraintError extends Error {
  code = 'P2002'
}

// Auth ve tercih route'ları için bellek içi Prisma taklidi.
// Gezi/AI akışları ayrı servis testlerinde doğrulanır.
export function createFakeDb() {
  const usersByEmail = new Map<string, StoredUser>()
  const usersById = new Map<string, StoredUser>()
  const preferences = new Map<string, StoredPreference>()

  const db = {
    user: {
      async create(args: {
        data: { email: string; passwordHash: string; name?: string | null }
        select?: unknown
      }) {
        if (usersByEmail.has(args.data.email)) throw new UniqueConstraintError()
        const now = new Date()
        const user: StoredUser = {
          id: randomUUID(),
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          name: args.data.name ?? null,
          createdAt: now,
          updatedAt: now,
        }
        usersByEmail.set(user.email, user)
        usersById.set(user.id, user)
        return { id: user.id, email: user.email, name: user.name }
      },
      async findUnique(args: { where: { email?: string; id?: string } }) {
        if (args.where.email) return usersByEmail.get(args.where.email) ?? null
        if (args.where.id) return usersById.get(args.where.id) ?? null
        return null
      },
    },
    preference: {
      async upsert(args: {
        where: { userId: string }
        create: Partial<StoredPreference> & { userId: string }
        update: Partial<StoredPreference>
      }) {
        const existing = preferences.get(args.where.userId)
        const record: StoredPreference = {
          id: existing?.id ?? randomUUID(),
          userId: args.where.userId,
          interests: args.update.interests ?? args.create.interests ?? existing?.interests ?? [],
          budgetLevel:
            args.update.budgetLevel ?? args.create.budgetLevel ?? existing?.budgetLevel ?? 'mid',
          travelStyle:
            args.update.travelStyle ?? args.create.travelStyle ?? existing?.travelStyle ?? 'balanced',
          pace: args.update.pace ?? args.create.pace ?? existing?.pace ?? 'moderate',
          updatedAt: new Date(),
        }
        preferences.set(args.where.userId, record)
        return record
      },
      async findUnique(args: { where: { userId: string } }) {
        return preferences.get(args.where.userId) ?? null
      },
    },
    async $queryRaw() {
      return [{ '?column?': 1 }]
    },
    async $disconnect() {},
  }

  return db as unknown as Db
}
