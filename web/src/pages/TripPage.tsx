import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getTrip } from '../api/trips'
import { Alert, Card } from '../components/ui'
import { formatDateRange, formatMoney, formatWeekday } from '../format'

export function TripPage() {
  const { tripId = '' } = useParams()
  const { data: trip, isPending, error } = useQuery({ queryKey: ['trip', tripId], queryFn: () => getTrip(tripId) })

  if (isPending) return <p className="muted">Yükleniyor…</p>
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return <Alert kind="error">{notFound ? 'Bu gezi bulunamadı.' : error.message}</Alert>
  }

  return (
    <div className="stack">
      <div>
        <h1>{trip.title}</h1>
        <p className="muted">
          {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)} · {trip.days.length} gün
          {trip.budget !== null && ` · Bütçe: ${formatMoney(trip.budget, trip.currency)}`}
        </p>
      </div>
      {trip.days.map((day) => (
        <Card key={day.id}>
          <h2 className="day-title">
            {day.dayIndex}. gün <span className="muted">· {formatWeekday(day.date)}</span>
          </h2>
        </Card>
      ))}
    </div>
  )
}
