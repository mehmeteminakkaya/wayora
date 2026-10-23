import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { deleteTrip, listTrips, type TripSummary } from '../api/trips'
import { Alert, Button, Card } from '../components/ui'
import { formatDateRange, formatMoney } from '../format'

function TripCard({ trip }: { trip: TripSummary }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => deleteTrip(trip.id),
    onSuccess: () => {
      queryClient.setQueryData<TripSummary[]>(['trips'], (list) => list?.filter((t) => t.id !== trip.id))
      queryClient.removeQueries({ queryKey: ['trip', trip.id] })
    },
  })

  function onDelete() {
    if (window.confirm(`"${trip.title}" gezisi silinsin mi? Bu işlem geri alınamaz.`)) remove.mutate()
  }

  return (
    <Card>
      <div className="row trip-card">
        <div className="trip-card-body">
          <h2 className="day-title">
            <Link to={`/geziler/${trip.id}`}>{trip.title}</Link>
          </h2>
          <p className="muted">
            {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)} · {trip.dayCount} gün
            {trip.budget !== null && ` · ${formatMoney(trip.budget, trip.currency)}`}
          </p>
        </div>
        <Button variant="danger" onClick={onDelete} disabled={remove.isPending} aria-label={`${trip.title} gezisini sil`}>
          {remove.isPending ? 'Siliniyor…' : 'Sil'}
        </Button>
      </div>
      {remove.isError && <Alert kind="error">Gezi silinemedi: {remove.error.message}</Alert>}
    </Card>
  )
}

export function TripsPage() {
  const { data: trips, isPending, error } = useQuery({ queryKey: ['trips'], queryFn: listTrips })

  return (
    <div className="stack">
      <div className="row page-head">
        <h1>Gezilerim</h1>
        <Link to="/geziler/yeni" className="btn btn-primary">
          Yeni gezi
        </Link>
      </div>
      {isPending && <p className="muted">Yükleniyor…</p>}
      {error && <Alert kind="error">{error.message}</Alert>}
      {trips?.length === 0 && (
        <Card>
          <div className="stack">
            <p>Henüz bir gezin yok.</p>
            <p>
              <Link to="/geziler/yeni">İlk gezini oluştur</Link>
            </p>
          </div>
        </Card>
      )}
      {trips?.map((trip) => <TripCard key={trip.id} trip={trip} />)}
    </div>
  )
}
