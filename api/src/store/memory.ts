import { randomUUID } from 'node:crypto'
import { EmailTakenError, type Preferences, type Store, type User } from './types.ts'

// Testler için bellek içi depo. Prisma deposuyla aynı davranır (benzersiz e-posta dahil).
export function createMemoryStore(): Store {
  const users: User[] = []
  const preferences = new Map<string, Preferences>()

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
  }
}
