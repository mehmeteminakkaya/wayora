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

// W-12. İlgi alanı değerleri route'ta doğrulanır (INTERESTS)
export type BudgetLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Pace = 'RELAXED' | 'BALANCED' | 'PACKED'
export type TravelStyle = 'SOLO' | 'COUPLE' | 'FAMILY' | 'FRIENDS'

export type Preferences = {
  interests: string[]
  budgetLevel: BudgetLevel
  pace: Pace
  travelStyle: TravelStyle | null
}

export type PreferenceStore = {
  get(userId: string): Promise<Preferences | null>
  // Yoksa oluşturur, varsa günceller
  save(userId: string, data: Preferences): Promise<Preferences>
}

// W-13. Tarihler 'YYYY-MM-DD'
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

// W-15. Saatler 'HH:MM'; maliyet gezinin para biriminde
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

export type TripDay = {
  id: string
  dayIndex: number
  date: string
  notes: string | null
  activities: Activity[]
}

export type Trip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number | null
  currency: Currency
  status: 'DRAFT' | 'PLANNED'
  createdAt: Date
  days: TripDay[]
}

// Listede günler yerine gün sayısı döner (W-14)
export type TripSummary = Omit<Trip, 'days' | 'createdAt'> & { dayCount: number }

export type NewTrip = Pick<Trip, 'title' | 'destination' | 'startDate' | 'endDate' | 'budget' | 'currency'>

export type TripStore = {
  // Gezi ve günleri tek seferde oluşturur
  create(userId: string, data: NewTrip, days: { dayIndex: number; date: string }[]): Promise<Trip>
  // Gezi başka kullanıcınınsa da null döner (varlığı sızmasın)
  findForUser(userId: string, tripId: string): Promise<Trip | null>
  // Başlangıç tarihine göre sıralı
  listForUser(userId: string): Promise<TripSummary[]>
  // Silindiyse true; gezi yoksa ya da başkasınınsa false
  deleteForUser(userId: string, tripId: string): Promise<boolean>
  // Günün sonuna ekler. Gün bu geziye ya da gezi bu kullanıcıya ait değilse null
  addActivity(userId: string, tripId: string, dayId: string, data: NewActivity): Promise<Activity | null>
  // Silindiyse true
  deleteActivity(userId: string, tripId: string, activityId: string): Promise<boolean>
}

export type Store = {
  users: UserStore
  preferences: PreferenceStore
  trips: TripStore
}
