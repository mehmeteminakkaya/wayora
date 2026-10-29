import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GripVertical } from 'lucide-react'
import { api } from '../api'
import type { Activity, ActivityCategory, CreateActivityInput, EventOffer, Trip } from '../api'
import { DetailSkeleton } from '../components/Skeletons'
import { LiveDiscovery } from '../components/LiveDiscovery'
import { CATEGORY_LABELS, formatMoney, formatShortDate } from '../lib/format'
import { cityCoords } from '../lib/photos'

const CATEGORY_OPTIONS: ActivityCategory[] = [
  'landmark',
  'museum',
  'food',
  'nature',
  'shopping',
  'other',
]

function formatDayShort(isoDate: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00.000Z`))
}

function durationLabel(startTime: string | null, endTime: string | null): string | null {
  if (!startTime || !endTime) return null
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return null
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  if (minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} dk`
  if (rest === 0) return `${hours} saat`
  return `${hours} saat ${rest} dk`
}

function priceLabel(value: number | null, currency: string): string {
  if (value === null) return 'Fiyat belirtilmedi'
  if (value === 0) return 'Ücretsiz'
  return formatMoney(value, currency)
}

function mapSrc(destination: string): string {
  const [lat, lng] = cityCoords(destination)
  const delta = 0.045
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta]
    .map((value) => value.toFixed(5))
    .join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`
}

function mapLink(destination: string): string {
  const [lat, lng] = cityCoords(destination)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`
}

function ActivityForm({
  currency,
  onSubmit,
  onCancel,
}: {
  currency: string
  onSubmit: (input: CreateActivityInput) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ActivityCategory>('landmark')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('12:00')
  const [cost, setCost] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Durak adı gerekli.')
      return
    }
    if (startTime && endTime && endTime <= startTime) {
      setError('Bitiş saati başlangıçtan sonra olmalı.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        title: trimmed,
        category,
        startTime: startTime || null,
        endTime: endTime || null,
        estimatedCost: cost === '' ? null : Number(cost),
        notes: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durak eklenemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="summary-card">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <p className="label">Yeni durak</p>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <label className="field">
          <span>Durak adı</span>
          <input
            className="input"
            type="text"
            required
            maxLength={200}
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn. Kahvaltı ve şehir turu"
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Kategori</span>
            <select
              className="select"
              value={category}
              onChange={(event) => setCategory(event.target.value as ActivityCategory)}
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item] ?? item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tahmini fiyat ({currency})</span>
            <input
              className="input"
              type="number"
              min="0"
              max="100000"
              step="1"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Başlangıç</span>
            <input
              className="input"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Bitiş</span>
            <input
              className="input"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Ekleniyor...' : 'Durağı ekle'}
          </button>
          <button className="btn btn-ghost" type="button" disabled={busy} onClick={onCancel}>
            Vazgeç
          </button>
        </div>
      </form>
    </div>
  )
}

export function TripDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [planNotice, setPlanNotice] = useState<{ tone: 'success' | 'warning'; text: string } | null>(
    null,
  )
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmTripDelete, setConfirmTripDelete] = useState(false)
  const [deletingTrip, setDeletingTrip] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmActivityId, setConfirmActivityId] = useState<string | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [reorderStatus, setReorderStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const dayTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (!selectedDayId) return
    const tab = dayTabRefs.current[selectedDayId]
    if (!tab) return
    const reduced = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
    tab.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDayId])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await api.getTrip(id)
        if (!active) return
        setTrip(result.trip)
        setSelectedDayId(result.trip.days[0]?.id ?? null)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Rota yüklenemedi')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  const hasPlan = trip ? trip.days.some((day) => day.activities.length > 0) : false

  async function handleGenerate() {
    if (!trip) return
    if (hasPlan && !confirmRegenerate) {
      setConfirmTripDelete(false)
      setConfirmRegenerate(true)
      return
    }

    setConfirmRegenerate(false)
    setGenerating(true)
    setError(null)
    setPlanNotice(null)
    try {
      const result = await api.generateTrip(trip.id)
      setTrip(result.trip)
      setSelectedDayId(result.trip.days[0]?.id ?? null)
      setShowAddForm(false)
      setConfirmActivityId(null)
      setPlanNotice(
        result.meta.fallback
          ? {
              tone: 'warning',
              text: 'Plan daha genel hazırlandı. Durakları düzenleyebilir ya da yeniden hazırlayabilirsin.',
            }
          : { tone: 'success', text: 'Plan hazır.' },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan oluşturulamadı')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDeleteTrip() {
    if (!trip) return
    setDeletingTrip(true)
    try {
      await api.deleteTrip(trip.id)
      navigate('/trips')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rota silinemedi')
      setDeletingTrip(false)
    }
  }

  async function handleAddActivity(dayId: string, input: CreateActivityInput) {
    if (!trip) return
    const { activity } = await api.addActivity(trip.id, dayId, input)
    setTrip((current) =>
      current
        ? {
            ...current,
            days: current.days.map((day) =>
              day.id === dayId ? { ...day, activities: [...day.activities, activity] } : day,
            ),
          }
        : current,
    )
    setShowAddForm(false)
  }

  async function handleAddEvent(event: EventOffer) {
    if (!trip || !activeDay) return
    const day = trip.days.find((item) => item.date === event.startDate)
    if (!day) {
      setPlanNotice({
        tone: 'warning',
        text: 'Bu etkinlik seçili günün tarihine ait değil. Önce doğru günü seç.',
      })
      return
    }

    try {
      const { activity } = await api.addActivity(trip.id, day.id, {
        title: event.name,
        category: 'other',
        startTime: event.startTime?.slice(0, 5) ?? null,
        endTime: null,
        estimatedCost: event.priceMin,
        notes: event.url ? `Ticketmaster: ${event.url}` : 'Ticketmaster etkinliği',
      })
      setTrip((current) =>
        current
          ? {
              ...current,
              days: current.days.map((item) =>
                item.id === day.id
                  ? { ...item, activities: [...item.activities, activity] }
                  : item,
              ),
            }
          : current,
      )
      setSelectedDayId(day.id)
      setPlanNotice({ tone: 'success', text: 'Etkinlik rotaya eklendi.' })
    } catch (err) {
      setPlanNotice({
        tone: 'warning',
        text: err instanceof Error ? err.message : 'Etkinlik rotaya eklenemedi.',
      })
    }
  }

  async function handleDeleteActivity(activity: Activity) {
    if (!trip) return
    setDeletingActivityId(activity.id)
    setError(null)
    try {
      await api.deleteActivity(activity.id)
      setTrip((current) =>
        current
          ? {
              ...current,
              days: current.days.map((day) => ({
                ...day,
                activities: day.activities.filter((item) => item.id !== activity.id),
              })),
            }
          : current,
      )
      setConfirmActivityId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durak silinemedi')
    } finally {
      setDeletingActivityId(null)
    }
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (!trip) {
    return (
      <div className="page">
        <section className="empty-state">
          <h1>Rota bulunamadı.</h1>
          <p>{error ?? 'Bu rota silinmiş ya da başka bir hesaba ait olabilir.'}</p>
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Tekrar dene
            </button>
            <Link className="btn btn-ghost" to="/trips">
              Rotalarıma dön
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const activeDay = trip.days.find((day) => day.id === selectedDayId) ?? trip.days[0] ?? null
  const activities = trip.days.flatMap((day) => day.activities)
  const estimatedTotal = activities.reduce((sum, activity) => sum + (activity.estimatedCost ?? 0), 0)
  const activeDayTotal = activeDay
    ? activeDay.activities.reduce((sum, activity) => sum + (activity.estimatedCost ?? 0), 0)
    : 0
  const remaining = trip.budget === null ? null : trip.budget - estimatedTotal
  const overBudget = remaining !== null && remaining < 0

  function selectDay(dayId: string) {
    setSelectedDayId(dayId)
    setShowAddForm(false)
    setConfirmActivityId(null)
  }

  function openAddForm() {
    if (!activeDay) return
    setView('list')
    setShowAddForm(true)
  }

  async function persistReorder(reordered: Activity[]) {
    if (!activeDay) return
    setReorderStatus('saving')
    setTrip((current) =>
      current
        ? {
            ...current,
            days: current.days.map((day) =>
              day.id === activeDay.id ? { ...day, activities: reordered } : day,
            ),
          }
        : current,
    )

    try {
      await Promise.all(
        reordered.map((activity, index) => api.reorderActivity(activity.id, index)),
      )
      setReorderStatus('saved')
      window.setTimeout(() => setReorderStatus('idle'), 1800)
    } catch (err) {
      setReorderStatus('error')
      setError(
        err instanceof Error
          ? `Sıra kaydedilemedi: ${err.message}`
          : 'Sıra kaydedilemedi. Sayfayı yenileyip tekrar dene.',
      )
    }
  }

  async function handleDrop(targetId: string) {
    if (!activeDay || !draggedActivityId || draggedActivityId === targetId) {
      setDraggedActivityId(null)
      setDropTargetId(null)
      return
    }

    const sourceIndex = activeDay.activities.findIndex((activity) => activity.id === draggedActivityId)
    const targetIndex = activeDay.activities.findIndex((activity) => activity.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const reordered = [...activeDay.activities]
    const [moved] = reordered.splice(sourceIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)
    setDraggedActivityId(null)
    setDropTargetId(null)
    await persistReorder(reordered)
  }

  async function handleMove(activityId: string, direction: -1 | 1) {
    if (!activeDay) return
    const index = activeDay.activities.findIndex((activity) => activity.id === activityId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= activeDay.activities.length) return
    const reordered = [...activeDay.activities]
    const [moved] = reordered.splice(index, 1)
    if (!moved) return
    reordered.splice(target, 0, moved)
    await persistReorder(reordered)
  }

  return (
    <div className="page with-sticky-action">
      <Link className="back-link" to="/trips">
        Rotalarım
      </Link>

      <header className="trip-header">
        <p className="eyebrow">
          {trip.destination} · {trip.days.length} gün
        </p>
        <h1>{trip.title}</h1>
        <p className="trip-header-meta">
          {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)} · {trip.days.length}{' '}
          gün ·{' '}
          {trip.budget === null
            ? 'Toplam bütçe belirtilmedi'
            : `Toplam bütçe ${formatMoney(trip.budget, trip.currency)}`}
        </p>
        {trip.notes && <p className="helper">{trip.notes}</p>}

        <div className="trip-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating}
            aria-busy={generating}
          >
            {generating
              ? 'Plan hazırlanıyor...'
              : hasPlan
                ? 'Planı yeniden hazırla'
                : 'Planı hazırla'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setConfirmRegenerate(false)
              setConfirmTripDelete(true)
            }}
          >
            Geziyi sil
          </button>
        </div>
      </header>

      {confirmRegenerate && (
        <div className="notice" role="group" aria-label="Planı yeniden hazırlama onayı">
          <p className="small">Mevcut plan silinip yeniden hazırlanacak. Devam edilsin mi?</p>
          <div className="form-actions">
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
              aria-busy={generating}
            >
              {generating ? 'Hazırlanıyor...' : 'Yeniden hazırla'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={generating}
              onClick={() => setConfirmRegenerate(false)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {confirmTripDelete && (
        <div className="notice" role="group" aria-label="Rotayı silme onayı">
          <p className="small">
            {trip.destination} rotası silinsin mi? Bu işlem geri alınamaz.
          </p>
          <div className="form-actions">
            <button
              className="btn btn-danger"
              type="button"
              disabled={deletingTrip}
              aria-busy={deletingTrip}
              onClick={() => void handleDeleteTrip()}
            >
              {deletingTrip ? 'Siliniyor...' : 'Rotayı sil'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={deletingTrip}
              onClick={() => setConfirmTripDelete(false)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {trip.status === 'failed' && !error && (
        <p className="notice error" role="alert">
          Plan oluşturulamadı. Yeniden deneyebilirsin.
        </p>
      )}

      {planNotice && (
        <p className={`notice ${planNotice.tone}`} role="status">
          {planNotice.text}
        </p>
      )}

      {reorderStatus !== 'idle' && (
        <p
          className={reorderStatus === 'error' ? 'notice error' : 'notice'}
          role="status"
          aria-live="polite"
        >
          {reorderStatus === 'saving'
            ? 'Durak sırası kaydediliyor...'
            : reorderStatus === 'saved'
              ? 'Durak sırası kaydedildi.'
              : 'Durak sırası kaydedilemedi. Tekrar deneyebilirsin.'}
        </p>
      )}

      {overBudget && remaining !== null && (
        <p className="notice">
          Tahmini durak maliyeti bütçeyi {formatMoney(Math.abs(remaining), trip.currency)} aşıyor.
        </p>
      )}

      <div className="segmented trip-view-toggle" role="group" aria-label="Plan görünümü">
        <button
          className={view === 'list' ? 'is-active' : ''}
          type="button"
          aria-pressed={view === 'list'}
          onClick={() => setView('list')}
        >
          Liste
        </button>
        <button
          className={view === 'map' ? 'is-active' : ''}
          type="button"
          aria-pressed={view === 'map'}
          onClick={() => {
            setView('map')
            setShowAddForm(false)
          }}
        >
          Harita
        </button>
      </div>

      {trip.days.length === 0 ? (
        <p className="notice">Bu rotada gün bulunmuyor. Planı yeniden hazırlayabilirsin.</p>
      ) : (
        <>
          <div className="day-tabs" role="group" aria-label="Günler">
            {trip.days.map((day) => {
              const active = activeDay?.id === day.id
              return (
                <button
                  key={day.id}
                  ref={(element) => {
                    dayTabRefs.current[day.id] = element
                  }}
                  className={active ? 'day-tab is-active' : 'day-tab'}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Gün ${day.dayIndex}, ${formatDayShort(day.date)}, ${day.activities.length} durak`}
                  onClick={() => selectDay(day.id)}
                >
                  <strong>{String(day.dayIndex).padStart(2, '0')}</strong>
                  <span>
                    {formatDayShort(day.date)} · {day.activities.length}
                  </span>
                </button>
              )
            })}
          </div>

          {activeDay && (
            <section
              key={activeDay.id}
              className="day-content"
              aria-label={`${formatDayShort(activeDay.date)} planı`}
            >
              <div className="day-board">
                <span>GÜN {String(activeDay.dayIndex).padStart(2, '0')}</span>
                <span>{activeDay.activities.length} DURAK</span>
                <span>
                  {activeDay.activities[0]?.startTime && activeDay.activities.at(-1)?.endTime
                    ? `${activeDay.activities[0].startTime} - ${activeDay.activities.at(-1)?.endTime}`
                    : 'SAAT YOK'}
                </span>
                <span>
                  {activeDayTotal === 0 ? 'ÜCRETSİZ' : formatMoney(activeDayTotal, trip.currency)}
                </span>
              </div>

              {view === 'map' ? (
                <div className="trip-map">
                  <div className="map-frame">
                    <p
                      className="map-fallback"
                      style={{ position: 'absolute', inset: 0, minHeight: 0 }}
                    >
                      Harita yüklenemedi. Aşağıdaki bağlantıdan OpenStreetMap'te açabilirsin.
                    </p>
                    <iframe
                      src={mapSrc(trip.destination)}
                      title={`${trip.destination} haritası`}
                      loading="lazy"
                    />
                  </div>
                  <p className="trip-note">
                    Harita {trip.destination} merkezini gösterir. Durakların adresleri aşağıda.
                  </p>
                  <a
                    className="section-link"
                    href={mapLink(trip.destination)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStreetMap'te aç
                  </a>

                  <div className="info-block">
                    <h2>Günün durakları</h2>
                    {activeDay.activities.length === 0 ? (
                      <p className="notice">Bu gün için durak yok.</p>
                    ) : (
                      <ul className="info-list">
                        {activeDay.activities.map((activity) => (
                          <li key={activity.id}>
                            <span>{activity.title}</span>
                            <strong>
                              {activity.place?.address ??
                                CATEGORY_LABELS[activity.category] ??
                                activity.category}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {showAddForm && (
                    <div className="info-block" id="add-activity-form">
                      <ActivityForm
                        currency={trip.currency}
                        onSubmit={(input) => handleAddActivity(activeDay.id, input)}
                        onCancel={() => setShowAddForm(false)}
                      />
                    </div>
                  )}

                  {activeDay.activities.length === 0 ? (
                    <p className="notice">
                      Bu gün henüz boş. "Güne durak ekle" ile ilk durağı ekleyebilirsin.
                    </p>
                  ) : (
                    <ol className="timeline" role="list">
                      {activeDay.activities.map((activity) => {
                        const duration = durationLabel(activity.startTime, activity.endTime)
                        const confirming = confirmActivityId === activity.id
                        const deleting = deletingActivityId === activity.id
                        return (
                          <li
                            className={`timeline-item${draggedActivityId === activity.id ? ' is-dragging' : ''}${dropTargetId === activity.id ? ' is-drop-target' : ''}`}
                            key={activity.id}
                            data-activity-id={activity.id}
                            draggable
                            onDragStart={() => {
                              setConfirmActivityId(null)
                              setDraggedActivityId(activity.id)
                            }}
                            onDragOver={(event) => {
                              event.preventDefault()
                              setDropTargetId(activity.id)
                            }}
                            onDrop={(event) => {
                              event.preventDefault()
                              void handleDrop(activity.id)
                            }}
                            onDragEnd={() => {
                              setDraggedActivityId(null)
                              setDropTargetId(null)
                            }}
                          >
                            <span className="timeline-time">
                              {activity.startTime ?? '--:--'}
                              {activity.endTime && (
                                <>
                                  <br />
                                  {activity.endTime}
                                </>
                              )}
                            </span>

                            <div className="timeline-body">
                              <h3>{activity.title}</h3>
                              <p className="meta-line">
                                <span>
                                  {CATEGORY_LABELS[activity.category] ?? activity.category}
                                </span>
                                {activity.place?.address && (
                                  <>
                                    <span className="dot" aria-hidden="true">
                                      ·
                                    </span>
                                    <span>{activity.place.address}</span>
                                  </>
                                )}
                              </p>
                              <p className="meta-line">
                                {duration && (
                                  <>
                                    <span>{duration}</span>
                                    <span className="dot" aria-hidden="true">
                                      ·
                                    </span>
                                  </>
                                )}
                                <span>{priceLabel(activity.estimatedCost, trip.currency)}</span>
                              </p>

                              {confirming ? (
                                <div
                                  className="notice"
                                  role="group"
                                  aria-label={`${activity.title} durağını silme onayı`}
                                >
                                  <p className="small">Bu durak silinsin mi?</p>
                                  <div className="form-actions">
                                    <button
                                      className="btn btn-danger"
                                      type="button"
                                      disabled={deleting}
                                      aria-busy={deleting}
                                      onClick={() => void handleDeleteActivity(activity)}
                                    >
                                      {deleting ? 'Siliniyor...' : 'Sil'}
                                    </button>
                                    <button
                                      className="btn btn-ghost"
                                      type="button"
                                      disabled={deleting}
                                      onClick={() => setConfirmActivityId(null)}
                                    >
                                      Vazgeç
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="row-actions">
                                  <button
                                    className="drag-handle"
                                    type="button"
                                    title="Sürükle veya ok tuşlarıyla sırala"
                                    aria-label={`${activity.title} durağını sırala`}
                                    onKeyDown={(event) => {
                                      if (event.key === 'ArrowUp') {
                                        event.preventDefault()
                                        void handleMove(activity.id, -1)
                                      }
                                      if (event.key === 'ArrowDown') {
                                        event.preventDefault()
                                        void handleMove(activity.id, 1)
                                      }
                                    }}
                                    onPointerDown={(event) => {
                                      if (event.pointerType === 'mouse') return
                                      event.currentTarget.setPointerCapture(event.pointerId)
                                      setDraggedActivityId(activity.id)
                                    }}
                                    onPointerMove={(event) => {
                                      if (event.pointerType === 'mouse' || draggedActivityId !== activity.id) {
                                        return
                                      }
                                      const row = document
                                        .elementsFromPoint(event.clientX, event.clientY)
                                        .find((element) => element.classList.contains('timeline-item'))
                                      const targetId = row?.getAttribute('data-activity-id')
                                      if (targetId && targetId !== activity.id) {
                                        setDropTargetId(targetId)
                                      }
                                    }}
                                    onPointerUp={(event) => {
                                      if (event.pointerType === 'mouse') return
                                      const targetId = dropTargetId
                                      setDraggedActivityId(null)
                                      setDropTargetId(null)
                                      if (targetId) void handleDrop(targetId)
                                    }}
                                    onPointerCancel={() => {
                                      setDraggedActivityId(null)
                                      setDropTargetId(null)
                                    }}
                                  >
                                    <GripVertical size={20} strokeWidth={1.75} />
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    onClick={() => setConfirmActivityId(activity.id)}
                                  >
                                    Durağı sil
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}

                  <p className="trip-note">
                    Yeni durak seçili günün sonuna eklenir.
                  </p>
                </>
              )}
            </section>
          )}
        </>
      )}

      {trip.tips.length > 0 && (
        <section className="info-block" aria-label="Pratik notlar">
          <h2>Pratik notlar</h2>
          <ul className="info-list">
            {trip.tips.map((tip) => (
              <li key={tip}>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LiveDiscovery
        city={trip.destination}
        startDate={trip.startDate}
        endDate={trip.endDate}
        activeDate={activeDay?.date}
        onAddEvent={(event) => void handleAddEvent(event)}
      />

      <div className="sticky-action trip-sticky">
        <span className="selection-count">
          {activeDay ? `Gün ${activeDay.dayIndex}` : 'Gün seçilmedi'}
        </span>
        <button
          className="btn btn-primary"
          type="button"
          onClick={openAddForm}
          disabled={!activeDay}
          aria-controls="add-activity-form"
          aria-expanded={showAddForm}
        >
          Güne durak ekle
        </button>
      </div>
    </div>
  )
}
