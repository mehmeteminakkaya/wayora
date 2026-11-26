/**
 * Minimal RFC 5545 (iCalendar) writer for exporting a trip to a calendar app.
 * Times are "floating" local wall-clock times: a 09:00 activity in Paris shows at 09:00.
 */

export type IcsActivity = {
  id: string
  title: string
  startTime: string | null
  endTime: string | null
  place?: { address: string | null } | null
}

export type IcsDay = {
  date: Date
  activities: IcsActivity[]
}

export type IcsTrip = {
  destination: string
  startDate: Date
  days: IcsDay[]
}

const CRLF = '\r\n'

/** Escape a TEXT value: backslash, semicolon, comma and line breaks. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function dateStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

function utcStamp(date: Date): string {
  return `${dateStamp(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

/** "09:00" on 2026-11-10 → { date: 2026-11-10, time: "090000" }, rolling past midnight. */
function localDateTime(day: Date, hhmm: string, plusMinutes = 0): string {
  const [hours, minutes] = hhmm.split(':').map(Number) as [number, number]
  const total = hours * 60 + minutes + plusMinutes
  const date = addUtcDays(day, Math.floor(total / 1440))
  const inDay = ((total % 1440) + 1440) % 1440
  return `${dateStamp(date)}T${pad(Math.floor(inDay / 60))}${pad(inDay % 60)}00`
}

/** File name like `wayora-paris-2026-11-10.ics`, ASCII only. */
export function icsFileName(trip: Pick<IcsTrip, 'destination' | 'startDate'>): string {
  const slug =
    trip.destination
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'rota'
  const start = trip.startDate.toISOString().slice(0, 10)
  return `wayora-${slug}-${start}.ics`
}

export function buildTripCalendar(trip: IcsTrip, now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wayora//Trip//TR', 'CALSCALE:GREGORIAN']
  const stamp = utcStamp(now)

  for (const day of trip.days) {
    for (const activity of day.activities) {
      lines.push('BEGIN:VEVENT', `UID:${activity.id}@wayora`, `DTSTAMP:${stamp}`)
      if (activity.startTime) {
        lines.push(`DTSTART:${localDateTime(day.date, activity.startTime)}`)
        lines.push(
          activity.endTime
            ? `DTEND:${localDateTime(day.date, activity.endTime)}`
            : `DTEND:${localDateTime(day.date, activity.startTime, 60)}`,
        )
      } else {
        lines.push(
          `DTSTART;VALUE=DATE:${dateStamp(day.date)}`,
          `DTEND;VALUE=DATE:${dateStamp(addUtcDays(day.date, 1))}`,
        )
      }
      lines.push(`SUMMARY:${escapeIcsText(activity.title)}`)
      const address = activity.place?.address
      if (address) lines.push(`LOCATION:${escapeIcsText(address)}`)
      lines.push('END:VEVENT')
    }
  }

  lines.push('END:VCALENDAR')
  return lines.join(CRLF) + CRLF
}
