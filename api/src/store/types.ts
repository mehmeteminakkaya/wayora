// Veri erişimi bu arayüzlerin arkasında: uygulama Prisma'yı (store/prisma.ts), testler bellek içi
// sahte deposunu (store/memory.ts) kullanır. Böylece testler veritabanı olmadan çalışır.

export type User = {
  id: string
  email: string
  passwordHash: string
  name: string | null
  createdAt: Date
}

export type NewUser = { email: string; passwordHash: string; name: string | null }

// E-posta zaten kayıtlıysa create bunu fırlatır
export class EmailTakenError extends Error {
  constructor() {
    super('email taken')
  }
}

export type UserStore = {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: NewUser): Promise<User>
}

export type Store = {
  users: UserStore
}
