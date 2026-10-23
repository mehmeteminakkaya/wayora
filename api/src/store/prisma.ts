import { Prisma } from '../generated/prisma/client.ts'
import type { Db } from '../lib/prisma.ts'
import { EmailTakenError, type Store } from './types.ts'

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'

export function createPrismaStore(db: Db): Store {
  return {
    users: {
      findByEmail: (email) => db.user.findUnique({ where: { email } }),
      findById: (id) => db.user.findUnique({ where: { id } }),
      async create(data) {
        try {
          return await db.user.create({ data })
        } catch (err) {
          if (isUniqueViolation(err)) throw new EmailTakenError()
          throw err
        }
      },
    },
  }
}
