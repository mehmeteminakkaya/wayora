export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00.000Z`))
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00.000Z`))
}

export function formatMoney(value: number | null, currency: string): string {
  if (value === null) return 'Belirtilmedi'
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} ${currency}`
  }
}

export function tripDayCount(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime()
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime()
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1)
}

export function todayIso(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const CATEGORY_LABELS: Record<string, string> = {
  museum: 'Müze',
  food: 'Yemek',
  nature: 'Doğa',
  landmark: 'Gezilecek yer',
  shopping: 'Alışveriş',
  other: 'Diğer',
}
