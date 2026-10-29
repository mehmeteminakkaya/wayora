import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Trip, TripStatus } from '../api'
import { cityImage, cityInitials } from '../lib/cityImage'
import { formatMoney, formatShortDate, tripDayCount } from '../lib/format'

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Taslak',
  generating: 'Hazırlanıyor',
  planned: 'Hazır',
  failed: 'Oluşturulamadı',
}

function statusStamp(status: TripStatus): string {
  if (status === 'planned') return 'stamp olive'
  if (status === 'failed') return 'stamp'
  return 'stamp ink'
}

function activityCount(trip: Trip): number {
  return trip.days.reduce((sum, day) => sum + day.activities.length, 0)
}

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .listTrips()
      .then(({ trips: items }) => {
        if (active) setTrips(items)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Geziler yüklenemedi')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleDelete(trip: Trip) {
    setDeletingId(trip.id)
    setError(null)
    try {
      await api.deleteTrip(trip.id)
      setTrips((current) => current.filter((item) => item.id !== trip.id))
      setConfirmId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gezi silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ROTASYON / {String(trips.length).padStart(2, '0')}</p>
          <h1>Rotaların</h1>
          <p>Taslakları, hazır planları ve bütçe notlarını tek defterde gör.</p>
        </div>
        <Link className="button" to="/trips/new">
          Yeni rota
        </Link>
      </div>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="center-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Rotalar yükleniyor…</span>
        </div>
      ) : trips.length === 0 ? (
        <section className="empty-state">
          <span className="empty-code" aria-hidden="true">
            00
          </span>
          <h2>Henüz rota yok.</h2>
          <p>Bir şehir, iki tarih yeterli. Bütçeyi istersen ekle; planı sonra düzenle.</p>
          <Link className="button" to="/trips/new">
            İlk rotayı çiz
          </Link>
        </section>
      ) : (
        <div className="trip-stack">
          {trips.map((trip, index) => {
            const image = cityImage(trip.destination)
            return (
            <article className="trip-ticket has-stamp" key={trip.id}>
              <span className="trip-index">{String(index + 1).padStart(2, '0')}</span>
              {image ? (
                <img className="trip-thumb" src={image} alt="" />
              ) : (
                <div className="trip-thumb trip-thumb-empty" aria-hidden="true">
                  {cityInitials(trip.destination)}
                </div>
              )}

              <div>
                <h2>
                  <Link to={`/trips/${trip.id}`}>{trip.title}</Link>
                </h2>
                <p className="trip-meta">
                  {trip.destination} · {formatShortDate(trip.startDate)} –{' '}
                  {formatShortDate(trip.endDate)} · {tripDayCount(trip.startDate, trip.endDate)} gün
                </p>

                <div className="trip-ticket-foot">
                  <div className="trip-figures">
                    <span>{activityCount(trip)} durak</span>
                    <span>
                      {trip.budget === null
                        ? 'Bütçe belirtilmedi'
                        : formatMoney(trip.budget, trip.currency)}
                    </span>
                  </div>

                  <div className="trip-actions">
                    <Link className="button ghost small" to={`/trips/${trip.id}`}>
                      Defteri aç
                    </Link>

                    {confirmId === trip.id ? (
                      <div className="inline-confirm">
                        <span>Silinsin mi?</span>
                        <button
                          className="button danger small"
                          type="button"
                          disabled={deletingId === trip.id}
                          onClick={() => handleDelete(trip)}
                        >
                          {deletingId === trip.id ? 'Siliniyor…' : 'Sil'}
                        </button>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => setConfirmId(null)}
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => setConfirmId(trip.id)}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <span className={statusStamp(trip.status)}>
                {STATUS_LABELS[trip.status] ?? trip.status}
              </span>
            </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
