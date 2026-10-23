import type { Currency } from './api/trips'

// API tarihleri 'YYYY-MM-DD'; UTC ile biçimlendirilir ki kullanıcının saat diliminde gün kaymasın
const dayFormat = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

const toDate = (day: string) => new Date(`${day}T00:00:00Z`)

export const formatDay = (day: string) => dayFormat.format(toDate(day))
export const formatWeekday = (day: string) => weekdayFormat.format(toDate(day))
export const formatDateRange = (start: string, end: string) =>
  start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`

export const formatMoney = (amount: number, currency: Currency) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
