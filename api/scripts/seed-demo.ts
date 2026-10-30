import { existsSync } from 'node:fs'
import { hashPassword } from '../src/lib/password.ts'
import { createPrisma } from '../src/lib/prisma.ts'

const DEMO_EMAIL = 'demo@wayora.app'
const DEMO_PASSWORD = 'demo1234'
const TRAVELER_EMAIL_PREFIX = 'demo+'
const DEMO_START = '2026-12-05'
const DEMO_END = '2026-12-09'

if (existsSync('.env')) process.loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL ?? ''
const isLocalDatabase =
  databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
const allowRemoteDemo = process.env.DEMO_SEED_ALLOW_PRODUCTION === 'true'

if ((!isLocalDatabase || process.env.NODE_ENV === 'production') && !allowRemoteDemo) {
  throw new Error(
    'Demo verisi varsayılan olarak yalnızca local veritabanında çalışır. Production demo için DEMO_SEED_ALLOW_PRODUCTION=true gerekir.',
  )
}

const db = createPrisma(databaseUrl)

function date(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function addDays(value: string, offset: number): string {
  const current = new Date(`${value}T00:00:00.000Z`)
  current.setUTCDate(current.getUTCDate() + offset)
  return current.toISOString().slice(0, 10)
}

const firstNames = [
  'Deniz',
  'Mert',
  'Selin',
  'Can',
  'Ada',
  'Ege',
  'Bora',
  'Duru',
  'Kerem',
  'İpek',
  'Arda',
  'Naz',
  'Cem',
  'Lara',
  'Efe',
  'Mira',
  'Ozan',
  'Sude',
  'Kaan',
  'Dila',
  'Tuna',
  'Ela',
  'Alp',
  'Nil',
  'Berk',
]

const lastNames = [
  'Yılmaz',
  'Kaya',
  'Demir',
  'Şahin',
  'Çelik',
  'Aydın',
  'Arslan',
  'Doğan',
  'Kılıç',
  'Aslan',
  'Çetin',
  'Kara',
  'Koç',
  'Kurt',
  'Özkan',
  'Şimşek',
  'Polat',
  'Erdoğan',
  'Güneş',
  'Bulut',
  'Aksoy',
  'Türk',
  'Yalçın',
  'Karaca',
  'Çakır',
]

const interestSets = [
  ['Müze', 'Yemek', 'Doğa'],
  ['Yemek', 'Gece', 'Müze'],
  ['Doğa', 'Tarih', 'Yemek'],
  ['Alışveriş', 'Müze', 'Yemek'],
  ['Tarih', 'Doğa', 'Müze'],
  ['Müze', 'Yemek', 'Tarih'],
  ['Gece', 'Yemek', 'Tarih'],
  ['Doğa', 'Müze', 'Tarih'],
]

const otherCities = [
  'Roma',
  'Lizbon',
  'Paris',
  'Barselona',
  'Amsterdam',
  'İstanbul',
  'Londra',
  'Prag',
  'Viyana',
]

const languages = [
  ['Türkçe', 'İngilizce'],
  ['Türkçe', 'Almanca'],
  ['Türkçe', 'İngilizce', 'Almanca'],
  ['Türkçe', 'Fransızca'],
]

const paceText = {
  slow: 'Tempoyu düşük tutup bir mahalleye yayılmayı seviyorum.',
  moderate: 'Dengeli bir tempo; hem keşif hem mola istiyorum.',
  fast: 'Sabah erken başlayıp günü dolu dolu geçirmeyi seviyorum.',
}

function bioFor(name: string, destination: string, interests: string[], pace: string): string {
  const [first, second] = interests
  const options = [
    `${destination}'da ${first.toLocaleLowerCase('tr-TR')} ve ${second.toLocaleLowerCase('tr-TR')} peşindeyim. ${paceText[pace as keyof typeof paceText]}`,
    `Kısa bir ${destination} molası planlıyorum. ${first} ve ${second} benim için iyi bir başlangıç. ${paceText[pace as keyof typeof paceText]}`,
    `${name.split(' ')[0]} olarak yeni şehirlerde yerel kafeleri ve ${first.toLocaleLowerCase('tr-TR')} duraklarını seviyorum. ${paceText[pace as keyof typeof paceText]}`,
    `${destination} için sakin bir rota yapıyorum; ${first} ve ${second} etrafında dolaşırım. ${paceText[pace as keyof typeof paceText]}`,
    `Seyahatte en çok ${first.toLocaleLowerCase('tr-TR')} ve ${second.toLocaleLowerCase('tr-TR')} anlarını seviyorum. ${paceText[pace as keyof typeof paceText]}`,
  ]
  return options[name.length % options.length]!.slice(0, 240)
}

function displayNameFor(index: number): string {
  const first = firstNames[index % firstNames.length]!
  const lastName =
    lastNames[(index + Math.floor(index / firstNames.length) * 8) % lastNames.length]!
  return `${first} ${lastName}`
}

async function createTraveler(index: number, passwordHash: string) {
  const name = displayNameFor(index)
  const isBerlin = index < 55
  const destination = isBerlin ? 'Berlin' : otherCities[(index - 55) % otherCities.length]!
  const interests = interestSets[index % interestSets.length]!
  const pace = (['slow', 'moderate', 'fast'] as const)[index % 3]!
  const start = isBerlin ? addDays('2026-12-02', index % 5) : addDays('2026-12-04', index % 4)
  const end = isBerlin ? addDays('2026-12-07', index % 4) : addDays('2026-12-09', index % 3)
  const hostingAvailable = index % 7 === 0 || index % 11 === 0
  const user = await db.user.create({
    data: {
      email: `${TRAVELER_EMAIL_PREFIX}${String(index + 1).padStart(2, '0')}@wayora.app`,
      passwordHash,
      name,
    },
  })
  await db.preference.create({
    data: {
      userId: user.id,
      interests,
      budgetLevel: ['low', 'mid', 'high'][index % 3]!,
      travelStyle: ['relaxed', 'balanced', 'packed'][index % 3]!,
      pace,
    },
  })
  await db.travelerProfile.create({
    data: {
      userId: user.id,
      displayName: name,
      bio: bioFor(name, destination, interests, pace),
      languages: languages[index % languages.length]!,
      hostingAvailable,
      hostingNote: hostingAvailable
        ? index % 2 === 0
          ? 'Kısa bir çay sohbetine açığım.'
          : 'Şehri birlikte keşfetmek için mola verebiliriz.'
        : null,
      visible: true,
      safetyAcceptedAt: new Date(),
    },
  })
  const trip = await db.trip.create({
    data: {
      userId: user.id,
      title: `${name.split(' ')[0]} · ${destination}`,
      destination,
      startDate: date(start),
      endDate: date(end),
      budget: 500 + (index % 5) * 100,
      currency: 'EUR',
      status: 'draft',
      notes: 'Demo amaçlı oluşturulmuş örnek rota.',
    },
  })
  return { user, trip, name }
}

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  await db.user.deleteMany({
    where: {
      OR: [{ email: DEMO_EMAIL }, { email: { startsWith: TRAVELER_EMAIL_PREFIX } }],
    },
  })

  const demo = await db.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash,
      name: 'Elif Yılmaz',
    },
  })
  await db.preference.create({
    data: {
      userId: demo.id,
      interests: ['Müze', 'Yemek', 'Doğa'],
      budgetLevel: 'mid',
      travelStyle: 'balanced',
      pace: 'moderate',
    },
  })
  await db.travelerProfile.create({
    data: {
      userId: demo.id,
      displayName: 'Elif',
      bio: 'Müzeleri, yerel mutfağı ve uzun yürüyüşleri seven sakin bir gezgin.',
      languages: ['Türkçe', 'İngilizce'],
      hostingAvailable: true,
      hostingNote: 'Kısa bir çay sohbetine açığım.',
      visible: true,
      safetyAcceptedAt: new Date(),
    },
  })
  const demoTrip = await db.trip.create({
    data: {
      userId: demo.id,
      title: 'Elif · Berlin',
      destination: 'Berlin',
      startDate: date(DEMO_START),
      endDate: date(DEMO_END),
      budget: 900,
      currency: 'EUR',
      status: 'planned',
      notes: 'Demo hesabının Berlin rotası.',
      days: {
        create: Array.from({ length: 5 }, (_, index) => ({
          dayIndex: index + 1,
          date: date(addDays(DEMO_START, index)),
        })),
      },
    },
  })

  const travelers = []
  for (let index = 0; index < 75; index += 1) {
    travelers.push(await createTraveler(index, passwordHash))
  }

  const pendingMessages = [
    'Berlin’de aynı günlerdeyiz; müze rotası için tanışalım mı?',
    'Selam! Aralık’ta Berlin’de olacağım, bir kahve içmek ister misin?',
    'Şehirde yerel bir yürüyüş planı yapıyorum, katılmak ister misin?',
  ]
  for (let index = 0; index < 3; index += 1) {
    const traveler = travelers[index]!
    await db.travelConnection.create({
      data: {
        requesterId: traveler.user.id,
        recipientId: demo.id,
        tripId: demoTrip.id,
        status: 'pending',
        message: pendingMessages[index],
      },
    })
  }

  for (let index = 3; index < 5; index += 1) {
    const traveler = travelers[index]!
    const connection = await db.travelConnection.create({
      data: {
        requesterId: traveler.user.id,
        recipientId: demo.id,
        tripId: demoTrip.id,
        status: 'accepted',
        message: 'Berlin’de birlikte bir müze gezisi yapalım.',
      },
    })
    await db.connectionMessage.createMany({
      data: [
        {
          connectionId: connection.id,
          senderId: traveler.user.id,
          body: 'Selam Elif! Cumartesi için bir müze planın var mı?',
        },
        {
          connectionId: connection.id,
          senderId: demo.id,
          body: 'Selam! Cumartesi öğleden sonra olabilir, hangi müze aklında?',
        },
        {
          connectionId: connection.id,
          senderId: traveler.user.id,
          body: 'Museum Island tarafına bakıyordum; senin için de uygun mu?',
        },
      ],
    })
  }

  const outgoing = travelers[5]!
  await db.travelConnection.create({
    data: {
      requesterId: demo.id,
      recipientId: outgoing.user.id,
      tripId: demoTrip.id,
      status: 'pending',
      message: 'Berlin’de aynı günlerdeyiz, tanışmak isterim.',
    },
  })

  console.log(
    JSON.stringify(
      {
        demo: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        seededTravelers: travelers.length,
        demoRoute: `${DEMO_START} – ${DEMO_END} Berlin`,
        connections: { incoming: 3, accepted: 2, outgoing: 1 },
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
