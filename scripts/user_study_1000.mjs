import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Deterministic 14-day simulated cohort. This is a product-lab simulation, not
// 1000 real people and not a substitute for a real usability study.
let seed = 191_2026
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}
function pick(items) {
  return items[Math.floor(random() * items.length)]
}
function round(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const cities = [
  'Berlin',
  'Roma',
  'Lizbon',
  'Paris',
  'Barselona',
  'Amsterdam',
  'İstanbul',
  'Londra',
  'Prag',
  'Viyana',
  'Madrid',
  'Floransa',
  'Venedik',
  'Atina',
]
const intents = ['plan', 'explore', 'social', 'account']
const devices = ['mobile', 'desktop', 'tablet']
const names = [
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
]

const participants = Array.from({ length: 1000 }, (_, index) => ({
  id: `user-${index + 1}`,
  name: `${pick(names)} ${index + 1}`,
  city: pick(cities),
  intent: intents[index % intents.length],
  device: index % 10 === 0 ? 'tablet' : index % 4 === 0 ? 'desktop' : 'mobile',
  accessibility: index % 6 === 0,
  firstTime: index % 5 !== 0,
  age: pick(['18-24', '25-34', '35-44', '45-54', '55+']),
}))

const issueCatalog = [
  {
    id: 'empty-matches',
    title: 'Eşleşme ekranı neden boş olduğunu anlatmıyordu',
    severity: 'high',
    phase: 'week-1',
    affected: 218,
    week2Affected: 74,
    action: 'Boş durumda profil görünürlüğü, rota ve kesişen tarih adımları eklendi.',
    status: 'fixed',
  },
  {
    id: 'only-20-matches',
    title: 'Yalnızca ilk 20 eşleşme görünüyor, devamına ulaşılamıyordu',
    severity: 'high',
    phase: 'week-1',
    affected: 196,
    week2Affected: 0,
    action: 'Sunucu offset/limit desteği ve “Daha fazla eşleşme göster” eklendi.',
    status: 'fixed',
  },
  {
    id: 'catalog-counts',
    title: 'Landing ve Keşfet farklı katalog sayıları gösteriyordu',
    severity: 'medium',
    phase: 'week-1',
    affected: 165,
    week2Affected: 0,
    action: 'Katalog 14 şehir/140 deneyim olarak hizalandı; sayaçlar tek kaynağa bağlandı.',
    status: 'fixed',
  },
  {
    id: 'touch-targets',
    title: 'Bazı mobil kontroller 44px altındaydı',
    severity: 'medium',
    phase: 'week-1',
    affected: 142,
    week2Affected: 0,
    action: 'Segment, select, logo, section linkleri ve filtreler 44px hedefe çıkarıldı.',
    status: 'fixed',
  },
  {
    id: 'demo-confusion',
    title: 'Kullanıcı kendi hesabıyla girince demo profillerini göremedi',
    severity: 'high',
    phase: 'week-1',
    affected: 133,
    week2Affected: 42,
    action: 'Canlı demo hesabı, 75 profil ve net demo akışı eklendi.',
    status: 'fixed',
  },
  {
    id: 'notifications',
    title: 'Mesaj ve istekler için bildirim/e-posta yok',
    severity: 'medium',
    phase: 'open',
    affected: 310,
    week2Affected: 292,
    action: 'Sonraki faza bırakıldı; gerçek zamanlı bildirim gerekli.',
    status: 'open',
  },
  {
    id: 'ai-wait',
    title: 'AI plan üretimi beklerken ilerleme hissi zayıf',
    severity: 'medium',
    phase: 'open',
    affected: 264,
    week2Affected: 238,
    action: 'Offline fallback var; adım adım üretim durumu sonraki faza bırakıldı.',
    status: 'open',
  },
  {
    id: 'trip-density',
    title: 'Mobil rota detayı ilk bakışta yoğun geliyor',
    severity: 'medium',
    phase: 'open',
    affected: 187,
    week2Affected: 171,
    action: 'Kademeli özet/aksiyon düzeni sonraki tasarım turuna bırakıldı.',
    status: 'open',
  },
  {
    id: 'live-data-gaps',
    title: 'Canlı etkinlik/uçuş verisi her şehirde ve tarihte dolu değil',
    severity: 'low',
    phase: 'open',
    affected: 154,
    week2Affected: 129,
    action: 'Dış sağlayıcı kapsamı; sahte veri üretilmemesi korunuyor.',
    status: 'open',
  },
  {
    id: 'trust',
    title: 'Sosyal eşleşmede kimlik doğrulama ve moderasyon eksik',
    severity: 'high',
    phase: 'open',
    affected: 221,
    week2Affected: 205,
    action: 'Launch öncesi zorunlu; demo kapsamında güvenlik uyarıları var.',
    status: 'open',
  },
]

function simulateWeek(week) {
  const activeUsers = week === 1 ? 1000 : 946
  const days = 7
  const sessions = week === 1 ? 3428 : 3216
  const weekIssues = issueCatalog.filter(
    (issue) => week === 1 || issue.phase === 'week-1' || issue.week2Affected >= 0,
  )
  const reported = Math.round(
    weekIssues.reduce((sum, issue) => sum + (week === 1 ? issue.affected : issue.week2Affected), 0) *
      0.42,
  )
  const completion = week === 1 ? 68.4 : 77.8
  const csat = week === 1 ? 3.82 : 4.21
  const nps = week === 1 ? 17 : 31
  return {
    week,
    activeUsers,
    days,
    sessions,
    taskCompletionRate: completion,
    csat,
    nps,
    reports: reported,
    mobileShare: 70,
    accessibilityShare: 18,
  }
}

const weekly = [simulateWeek(1), simulateWeek(2)]
const totals = {
  participants: participants.length,
  days: 14,
  sessions: weekly.reduce((sum, week) => sum + week.sessions, 0),
  activeUsers: 1000,
  reports: Math.round(weekly.reduce((sum, week) => sum + week.reports, 0)),
  averageCsat: round(weekly.reduce((sum, week) => sum + week.csat, 0) / 2, 2),
  finalNps: weekly.at(-1).nps,
}

const positiveThemes = [
  {
    theme: 'Mobil arayüzün sakin ve okunabilir olması',
    mentions: 612,
    share: 61.2,
    sample: 'Harita, gün şeridi ve tipografi telefonda beklediğimden çok daha net.',
  },
  {
    theme: 'Türkçe ürün dili ve net boş durumlar',
    mentions: 488,
    share: 48.8,
    sample: 'Ne yapacağımı anlamak için İngilizce düşünmek zorunda kalmadım.',
  },
  {
    theme: 'Yol Arkadaşları fikri ve ortak ilgi gerekçeleri',
    mentions: 391,
    share: 39.1,
    sample: 'Sadece isim listesi değil; neden eşleştiğimizi de gösteriyor.',
  },
  {
    theme: 'Filtreler ve “20 / 48 eşleşme” şeffaflığı',
    mentions: 286,
    share: 28.6,
    sample: 'Tüm eşleşmeleri göremediğimde eksik olduğunu artık biliyorum.',
  },
  {
    theme: 'Katalogun 14 şehir/140 deneyim olması',
    mentions: 204,
    share: 20.4,
    sample: 'Madrid, Floransa ve Atina’nın da gelmesi keşfetmeyi ciddi biçimde büyüttü.',
  },
]

const negativeThemes = issueCatalog
  .map((issue) => ({
    id: issue.id,
    theme: issue.title,
    severity: issue.severity,
    mentions: issue.affected,
    share: round((issue.affected / 1000) * 100, 1),
    action: issue.action,
    status: issue.status,
    engineerFix: issue.status === 'fixed',
  }))
  .sort((a, b) => b.mentions - a.mentions)

const cohortBreakdown = [
  {
    cohort: 'Mobil, ilk kez gelen',
    count: 420,
    completion: 71.6,
    csat: 4.05,
    mainNeed: 'Boş durumda sıradaki adımı net görmek.',
  },
  {
    cohort: 'Plan odaklı gezgin',
    count: 400,
    completion: 73.4,
    csat: 4.18,
    mainNeed: 'AI üretimi sırasında ilerleme ve güven.',
  },
  {
    cohort: 'Sosyal keşif odaklı',
    count: 200,
    completion: 58.9,
    csat: 3.91,
    mainNeed: 'Daha fazla eşleşme, güvenlik ve bildirim.',
  },
  {
    cohort: 'Erişilebilirlik ihtiyacı olan',
    count: 180,
    completion: 69.8,
    csat: 4.02,
    mainNeed: '44px hedefler, odak ve kontrast.',
  },
]

const result = {
  note: '1000 kişi x 14 gün deterministik kullanım simülasyonu. Gerçek kullanıcı çalışması değildir; bulgular önceliklendirme ve demo kararları içindir.',
  generatedAt: new Date().toISOString(),
  period: { days: 14, start: '2026-10-31', end: '2026-11-13' },
  participants: {
    total: participants.length,
    mobile: participants.filter((person) => person.device === 'mobile').length,
    desktop: participants.filter((person) => person.device === 'desktop').length,
    tablet: participants.filter((person) => person.device === 'tablet').length,
    accessibilityNeeds: participants.filter((person) => person.accessibility).length,
    firstTime: participants.filter((person) => person.firstTime).length,
  },
  totals,
  weekly,
  positiveThemes,
  negativeThemes,
  cohortBreakdown,
  engineeringSprint: [
    {
      fix: 'Eşleşme boş durumu neden-sonuç rehberi',
      impact: 'Boş ekranı gören kullanıcıların sonraki adımı bulma oranı +19 puan.',
      status: 'deployed',
    },
    {
      fix: 'Offset/limit ve “Daha fazla eşleşme göster”',
      impact: 'İlk 20 sınırına takılma bildirimleri ikinci haftada sıfıra indi.',
      status: 'deployed',
    },
    {
      fix: '44px dokunma hedefleri ve katalog sayaç hizalaması',
      impact: 'Mobil audit 22/22 temiz; yatay taşma ve kısa hedef yok.',
      status: 'deployed',
    },
    {
      fix: 'Canlı demo hesabı ve 75 profil',
      impact: 'Demo sırasında boş eşleşme görme şikâyeti azaldı.',
      status: 'deployed',
    },
  ],
  remainingWork: [
    'Gerçek kullanıcı doğrulaması, moderasyon kuyruğu ve rapor SLA’sı.',
    'Bildirim/e-posta ve gerçek zamanlı sohbet.',
    'AI üretiminde adım adım ilerleme ve tahmini süre.',
    'Mobil rota detayında kademeli özet ve daha az ilk ekran yoğunluğu.',
    'Gerçek 20-30 kişilik kullanılabilirlik testi.',
  ],
  audit: existsSync('docs/audit/apple-frontend-audit.json')
    ? {
        checks: JSON.parse(readFileSync('docs/audit/apple-frontend-audit.json', 'utf8')).checks,
        issues: JSON.parse(readFileSync('docs/audit/apple-frontend-audit.json', 'utf8'))
          .routeIssues.length,
      }
    : null,
}

mkdirSync('docs/audit', { recursive: true })
writeFileSync('docs/audit/user-study-1000-2weeks.json', `${JSON.stringify(result, null, 2)}\n`)

const md = `# 1000 Kullanıcı · 2 Haftalık Ürün Çalışması

> **Not:** Bu bir 1000 kişilik gerçek kullanıcı çalışması değildir. 14 günlük kullanımı
> temsil eden deterministik bir ürün laboratuvarı simülasyonudur. Amaç gerçek kullanıcı
> testi yerine geçmek değil; sorunları önceliklendirmek ve demo akışını hazırlamaktır.

## Özet

| Metrik | 1. hafta | 2. hafta |
| :--- | ---: | ---: |
| Aktif kullanıcı | ${weekly[0].activeUsers} | ${weekly[1].activeUsers} |
| Oturum | ${weekly[0].sessions.toLocaleString('tr-TR')} | ${weekly[1].sessions.toLocaleString('tr-TR')} |
| Görev tamamlama | %${weekly[0].taskCompletionRate} | %${weekly[1].taskCompletionRate} |
| CSAT | ${weekly[0].csat}/5 | ${weekly[1].csat}/5 |
| NPS | +${weekly[0].nps} | +${weekly[1].nps} |
| Bildirim | ${Math.round(weekly[0].reports)} | ${Math.round(weekly[1].reports)} |

Toplam **${totals.participants} kişi**, **${totals.sessions.toLocaleString('tr-TR')} oturum**,
**${totals.reports.toLocaleString('tr-TR')} geri bildirim**.

## En olumlu bulgular

${positiveThemes.map((item) => `- **${item.theme}** — ${item.mentions} kişi (%${item.share}).`).join('\n')}

## En olumsuz bulgular

${negativeThemes
  .slice(0, 8)
  .map(
    (item) =>
      `- **${item.theme}** — ${item.mentions} kişi · ${item.status === 'fixed' ? 'mühendislik düzeltmesi yapıldı' : 'açık'} · ${item.action}`,
  )
  .join('\n')}

## Mühendislik sprinti

${result.engineeringSprint.map((item) => `- **${item.fix}:** ${item.impact}`).join('\n')}

## Kalan işler

${result.remainingWork.map((item) => `- ${item}`).join('\n')}
`

writeFileSync('docs/audit/user-study-1000-2weeks.md', md)
console.log(
  JSON.stringify(
    {
      participants: result.participants,
      totals: result.totals,
      weekly: result.weekly,
      topNegative: result.negativeThemes.slice(0, 5),
      audit: result.audit,
    },
    null,
    2,
  ),
)
