// Gün tarihleri her yerde 'YYYY-MM-DD' metni olarak taşınır; saat dilimi kayması olmaz.

const DAY_MS = 24 * 60 * 60 * 1000

export const toDate = (day: string) => new Date(`${day}T00:00:00.000Z`)
export const toDay = (date: Date) => date.toISOString().slice(0, 10)

// '2026-02-30' gibi takvimde olmayan günleri de reddeder
export function isValidDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toDay(toDate(value)) === value
}

// Başlangıç ve bitiş dahil gün sayısı
export const dayCount = (start: string, end: string) =>
  Math.round((toDate(end).getTime() - toDate(start).getTime()) / DAY_MS) + 1

// Gezinin günleri: [{ dayIndex: 1, date: start }, …, { dayIndex: n, date: end }]
export function tripDays(start: string, end: string) {
  return Array.from({ length: dayCount(start, end) }, (_, i) => ({
    dayIndex: i + 1,
    date: toDay(new Date(toDate(start).getTime() + i * DAY_MS)),
  }))
}
