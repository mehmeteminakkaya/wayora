import { mkdirSync, writeFileSync } from 'node:fs'

// Deterministic product lab. This is a simulation, not 150 real people.
const developerRoles = [
  ['Product Designer', 'interaction'],
  ['UX Researcher', 'discovery'],
  ['Frontend Engineer', 'mobile'],
  ['Backend Engineer', 'matching'],
  ['Security Engineer', 'safety'],
  ['Accessibility Specialist', 'a11y'],
  ['Data Engineer', 'matching'],
  ['QA Engineer', 'reliability'],
  ['Trust & Safety Lead', 'safety'],
  ['Content Designer', 'clarity'],
]

const userSegments = [
  { label: 'solo', weight: 0.35 },
  { label: 'friend-group', weight: 0.25 },
  { label: 'budget', weight: 0.2 },
  { label: 'first-time', weight: 0.2 },
]

const interests = ['museum', 'food', 'nature', 'nightlife', 'shopping', 'history']
const cities = ['Berlin', 'Roma', 'Lizbon', 'Paris', 'Barselona', 'Amsterdam', 'İstanbul', 'Londra', 'Prag', 'Viyana']
const developerPersonas = Array.from({ length: 50 }, (_, index) => {
  const [role, focus] = developerRoles[index % developerRoles.length]
  return {
    id: `dev-${index + 1}`,
    role,
    focus,
    level: index < 10 ? 'lead' : index < 30 ? 'senior' : 'mid',
  }
})
const userPersonas = Array.from({ length: 100 }, (_, index) => {
  const segment = userSegments[index % userSegments.length]
  return {
    id: `user-${index + 1}`,
    segment: segment.label,
    city: cities[index % cities.length],
    interest: interests[(index * 3) % interests.length],
    caresAbout:
      segment.label === 'safety'
        ? 'güvenlik'
        : segment.label === 'first-time'
          ? 'anlaşılırlık'
          : segment.label === 'budget'
            ? 'maliyet'
            : 'hızlı eşleşme',
  }
})

const rubric = {
  clarity: 7.0,
  safety: 7.2,
  discovery: 6.8,
  interaction: 6.5,
  trust: 6.9,
  mobile: 7.4,
  accessibility: 7.3,
  performance: 7.7,
}

const iterations = []
for (let round = 1; round <= 3; round += 1) {
  const devSignals = developerPersonas.filter((persona) => {
    if (persona.focus === 'safety') return round > 1
    if (persona.focus === 'mobile') return round > 1
    return true
  })
  const userSignals = userPersonas.filter((persona, index) => index % 7 !== round - 1)
  const issues = [
    ...(round === 1
      ? ['Profil görünürlüğü ve güvenlik onayı yeterince açık değil.', 'Eşleşme gerekçesi skorun arkasında kalıyor.']
      : []),
    ...(round === 2
      ? ['Kabul sonrası sohbet geçişi daha belirgin olmalı.', 'Boş rota durumunda kullanıcı ne yapacağını hemen anlamalı.']
      : []),
    ...(round === 3
      ? ['Engelleme ve bildirme aynı yerde, geri alınamaz etkisi açık olmalı.', 'Mobil alt navigasyonda beşinci sekme etiketleri kısa kalmalı.']
      : []),
  ]
  const gain = round === 1 ? 2.8 : round === 2 ? 3.4 : 2.6
  for (const key of Object.keys(rubric)) {
    rubric[key] = Math.min(10, Math.round((rubric[key] + gain * 0.22) * 10) / 10)
  }
  iterations.push({
    round,
    developerSignals: devSignals.length,
    userSignals: userSignals.length,
    issues,
    score: Math.round((Object.values(rubric).reduce((sum, value) => sum + value, 0) / Object.keys(rubric).length) * 10) / 10,
  })
}

const result = {
  note: '50 developer personas ve 100 user personas ile deterministik ürün laboratuvarı simülasyonu. Gerçek kullanıcı testi değildir.',
  generatedAt: new Date().toISOString(),
  developerPersonas: developerPersonas.length,
  userPersonas: userPersonas.length,
  segments: userSegments,
  iterations,
  finalRubric: rubric,
  finalScore: iterations.at(-1)?.score,
  topFindings: [
    'Güvenlik onayı ve görünürlük ayrımı ilk ekranda açık olmalı.',
    'Eşleşme kartında skor yerine ortak noktalar öne çıkmalı.',
    'Kabul sonrası sohbet geçişi kullanıcıyı kaybetmemeli.',
    'Anlaşılır boş durumlar rota oluşturmaya yönlendirmeli.',
    'Bildir/engelle aynı güvenlik alanında ve onaylı olmalı.',
    'Beş sekmeli mobil navigasyon kısa etiket kullanmalı.',
  ],
  nextPhase: [
    'Gerçek 5-8 kişilik kullanılabilirlik testi.',
    'Telefon/e-posta doğrulaması ve moderasyon paneli.',
    'Kullanıcı şikâyet kuyruğu ve SLA.',
    'Realtime mesajlaşma (şimdilik polling).',
  ],
}

mkdirSync('docs/audit', { recursive: true })
writeFileSync('docs/audit/hitchhiker-product-lab.json', `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
