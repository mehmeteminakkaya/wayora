import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Trip, TripStatus } from '../api'
import { Photo } from '../components/Photo'
import { CardsSkeleton } from '../components/Skeletons'
import { formatMoney, formatShortDate, todayIso, tripDayCount } from '../lib/format'
import { cityPhoto, cityPhotoLabel } from '../lib/photos'

type TripGroup = 'upcoming' | 'draft' | 'past'

const TAB_ORDER: TripGroup[] = ['upcoming', 'draft', 'past']

const TAB_LABELS: Record<TripGroup, string> = {
  upcoming: 'Yaklaşan',
  draft: 'Taslak',
  past: 'Geçmiş',
}

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Taslak',
  generating: 'Hazırlanıyor',
  planned: 'Plan hazır',
  failed: 'Plan eksik',
}

function groupTrips(trips: Trip[], today: string): Record<TripGroup, Trip[]> {
  const groups: Record<TripGroup, Trip[]> = {
    upcoming: [],
    draft: [],
    past: [],
  }

  for (const trip of trips) {
    if (trip.status === 'draft' || trip.status === 'failed') {
      groups.draft.push(trip)
    } else if (trip.endDate < today) {
      groups.past.push(trip)
    } else {
      groups.upcoming.push(trip)
    }
  }

  groups.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate))
  groups.draft.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  groups.past.sort((a, b) => b.endDate.localeCompare(a.endDate))

  return groups
}

function activityCount(trip: Trip): number {
  return trip.days.reduce((total, day) => total + day.activities.length, 0)
}

function daysUntil(isoDate: string, today: string): number {
  const start = Date.parse(`${isoDate}T00:00:00.000Z`)
  const now = Date.parse(`${today}T00:00:00.000Z`)
  return Math.round((start - now) / 86_400_000)
}

function countdownLabel(trip: Trip, today: string): string {
  const remaining = daysUntil(trip.startDate, today)
  if (remaining > 0) return `KALKIŞA ${remaining} GÜN`
  if (remaining === 0) return 'BUGÜN KALKIŞ'
  return 'ROTA BAŞLADI'
}

function statusClass(status: TripStatus): string {
  if (status === 'planned') return 'status go'
  if (status === 'failed') return 'status stop'
  return 'status'
}

function TripCard({
  trip,
  today,
  showCountdown,
  confirming,
  deleting,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  trip: Trip
  today: string
  showCountdown: boolean
  confirming: boolean
  deleting: boolean
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  const draft = trip.status === 'draft' || trip.status === 'failed'
  const stops = activityCount(trip)

  return (
    <article className="trip-card">
      {showCountdown && <div className="countdown">{countdownLabel(trip, today)}</div>}

      <Photo
        className="trip-card-media"
        src={cityPhoto(trip.destination)}
        alt={`${trip.destination} şehir fotoğrafı`}
        label={cityPhotoLabel(trip.destination)}
      />

      <div className="trip-card-body">
        <div className="trip-card-title">
          <h2>
            <Link to={`/trips/${trip.id}`}>{trip.destination}</Link>
          </h2>
          <span className={statusClass(trip.status)}>
            {STATUS_LABELS[trip.status] ?? trip.status}
          </span>
        </div>

        {trip.title !== trip.destination && trip.title !== `${trip.destination} rotası` && (
          <p className="small muted">{trip.title}</p>
        )}

        <p className="meta-line">
          <span>
            {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}
          </span>
        </p>

        <p className="meta-line">
          <span>{tripDayCount(trip.startDate, trip.endDate)} gün</span>
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <span>{stops} durak</span>
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <span>
            {trip.budget === null
              ? 'Bütçe belirtilmedi'
              : formatMoney(trip.budget, trip.currency)}
          </span>
        </p>

        {confirming ? (
          <div
            className="notice"
            role="group"
            aria-label={`${trip.destination} rotasını silme onayı`}
          >
            <p className="small">
              {trip.destination} rotası silinsin mi? Bu işlem geri alınamaz.
            </p>
            <div className="form-actions">
              <button
                className="btn btn-danger"
                type="button"
                disabled={deleting}
                aria-busy={deleting}
                onClick={onDelete}
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={deleting}
                onClick={onCancelDelete}
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <div className="trip-card-actions">
            <Link className={draft ? 'btn btn-primary' : 'btn btn-secondary'} to={`/trips/${trip.id}`}>
              {draft ? 'Planı tamamla' : 'Rotayı aç'}
            </Link>
            <button
              className="btn btn-ghost"
              type="button"
              aria-label={`${trip.destination} rotasını sil`}
              onClick={onAskDelete}
            >
              Sil
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export function TripsPage() {
  const today = todayIso()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TripGroup>('upcoming')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .listTrips()
      .then(({ trips: items }) => {
        if (!active) return
        setTrips(items)
        const groups = groupTrips(items, today)
        if (groups.upcoming.length > 0) setActiveTab('upcoming')
        else if (groups.draft.length > 0) setActiveTab('draft')
        else if (groups.past.length > 0) setActiveTab('past')
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Rotalar yüklenemedi')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [today, reloadKey])

  const groups = useMemo(() => groupTrips(trips, today), [trips, today])
  const visibleTrips = groups[activeTab]

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const next = TAB_ORDER[(index + direction + TAB_ORDER.length) % TAB_ORDER.length]
    setActiveTab(next)
    document.getElementById(`trips-tab-${next}`)?.focus()
  }

  async function handleDelete(trip: Trip) {
    setDeletingId(trip.id)
    setError(null)
    try {
      await api.deleteTrip(trip.id)
      setTrips((current) => current.filter((item) => item.id !== trip.id))
      setConfirmId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rota silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Rotalarım</h1>
          <p>Yaklaşan, taslak ve geçmiş planların tek yerde.</p>
        </div>
        <Link
          className="btn btn-primary"
          to="/trips/new"
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Yeni rota
        </Link>
      </header>

      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => {
              setError(null)
              setLoading(true)
              setReloadKey((value) => value + 1)
            }}
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Rota durumu">
        {TAB_ORDER.map((tab, index) => {
          const selected = activeTab === tab
          return (
            <button
              key={tab}
              id={`trips-tab-${tab}`}
              className={selected ? 'tab is-active' : 'tab'}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="trips-panel"
              aria-label={`${TAB_LABELS[tab]}, ${groups[tab].length} rota`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span>{TAB_LABELS[tab]}</span>
              <span className="data" aria-hidden="true" style={{ marginLeft: 8 }}>
                {groups[tab].length}
              </span>
            </button>
          )
        })}
      </div>

      <div id="trips-panel" role="tabpanel" aria-labelledby={`trips-tab-${activeTab}`}>
        {loading ? (
          <CardsSkeleton count={2} />
        ) : trips.length === 0 ? (
          <div className="section">
            <section className="empty-state">
              <h2>Henüz rota yok.</h2>
              <p>
                Bir şehir ve iki tarih yeterli. Keşfet rehberinden ilham al ya da sıfırdan
                planlamaya başla.
              </p>
              <div className="form-actions">
                <Link className="btn btn-primary" to="/trips/new">
                  Yeni rota oluştur
                </Link>
                <Link className="btn btn-secondary" to="/kesfet">
                  Şehirleri keşfet
                </Link>
              </div>
            </section>
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="section">
            <section className="empty-state">
              <h2>{TAB_LABELS[activeTab]} rota yok.</h2>
              <p>
                {activeTab === 'upcoming'
                  ? 'Yeni bir rota oluşturarak yaklaşan planlarını burada topla.'
                  : activeTab === 'draft'
                    ? 'Tamamlanmayı bekleyen bir taslak yok. Yeni bir rota başlatabilirsin.'
                    : 'Geçmiş bir rota burada görünmüyor. Tamamlanan planlar tarih geçince bu sekmeye taşınır.'}
              </p>
              <Link className="btn btn-primary" to={activeTab === 'upcoming' ? '/kesfet' : '/trips/new'}>
                {activeTab === 'upcoming' ? 'Şehirleri keşfet' : 'Yeni rota oluştur'}
              </Link>
            </section>
          </div>
        ) : (
          <div className="trip-list">
            {visibleTrips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                today={today}
                showCountdown={activeTab === 'upcoming' && index === 0}
                confirming={confirmId === trip.id}
                deleting={deletingId === trip.id}
                onAskDelete={() => setConfirmId(trip.id)}
                onCancelDelete={() => setConfirmId(null)}
                onDelete={() => void handleDelete(trip)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
