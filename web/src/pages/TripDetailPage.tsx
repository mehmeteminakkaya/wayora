import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import type { Activity, ActivityCategory, CreateActivityInput, Trip } from '../api'
import { CATEGORY_LABELS, formatDate, formatMoney } from '../lib/format'
import { cityImage, cityInitials } from '../lib/cityImage'

const CATEGORY_OPTIONS: ActivityCategory[] = [
  'landmark',
  'museum',
  'food',
  'nature',
  'shopping',
  'other',
]

function ActivityForm({
  onSubmit,
  onCancel,
}: {
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
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        title,
        category,
        startTime: startTime || null,
        endTime: endTime || null,
        estimatedCost: cost === '' ? null : Number(cost),
        notes: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktivite eklenemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <label className="field">
        <span>Aktivite</span>
        <input
          type="text"
          required
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Örn. Kahvaltı ve şehir turu"
        />
      </label>

      <div className="three-column">
        <label className="field">
          <span>Kategori</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ActivityCategory)}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Başlangıç</span>
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Bitiş</span>
          <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
        </label>
      </div>

      <label className="field">
        <span>Tahmini maliyet (opsiyonel)</span>
        <input
          type="number"
          min="0"
          step="1"
          value={cost}
          onChange={(event) => setCost(event.target.value)}
          placeholder="0"
        />
      </label>

      <div className="form-actions">
        <button className="button small" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Ekleniyor…' : 'Ekle'}
        </button>
        <button className="button ghost small" type="button" onClick={onCancel}>
          İptal
        </button>
      </div>
    </form>
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
  const [openDayId, setOpenDayId] = useState<string | null>(null)
  const [confirmTripDelete, setConfirmTripDelete] = useState(false)
  const [deletingTrip, setDeletingTrip] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmActivityId, setConfirmActivityId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await api.getTrip(id)
        if (active) setTrip(result.trip)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Gezi yüklenemedi')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  async function handleGenerate() {
    if (!trip) return
    if (hasPlan && !confirmRegenerate) {
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
      setError(err instanceof Error ? err.message : 'Gezi silinemedi')
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
    setOpenDayId(null)
  }

  async function handleDeleteActivity(activity: Activity) {
    if (!trip) return
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
      setError(err instanceof Error ? err.message : 'Aktivite silinemedi')
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="center-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Gezi yükleniyor…</span>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="page-shell">
        <section className="empty-state">
          <span className="empty-code" aria-hidden="true">
            404
          </span>
          <h1>Gezi bulunamadı.</h1>
          <p>{error ?? 'Bu gezi silinmiş ya da başka bir hesaba ait olabilir.'}</p>
          <Link className="button" to="/trips">
            Rotalara dön
          </Link>
        </section>
      </div>
    )
  }

  const activities = trip.days.flatMap((day) => day.activities)
  const estimatedTotal = activities.reduce((sum, activity) => sum + (activity.estimatedCost ?? 0), 0)
  const remaining = trip.budget === null ? null : trip.budget - estimatedTotal
  const overBudget = remaining !== null && remaining < 0
  const hasPlan = activities.length > 0
  const heroImage = cityImage(trip.destination)
  const emptyDays = trip.days.filter((day) => day.activities.length === 0).length
  const progress =
    trip.budget === null || trip.budget <= 0
      ? 0
      : Math.min(100, Math.round((estimatedTotal / trip.budget) * 100))

  return (
    <div className="page-shell">
      <Link className="back-link" to="/trips">
        ← Rotalar
      </Link>

      <header className="trip-hero">
        <div>
          <p className="eyebrow">
            {trip.destination} / {String(trip.days.length).padStart(2, '0')} GÜN
          </p>
          <h1>{trip.title}</h1>
          <p className="trip-sub">
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {trip.currency}
          </p>
          {trip.notes && <p className="trip-notes">{trip.notes}</p>}

          <div className="trip-actions">
            {confirmRegenerate && hasPlan ? (
              <div className="inline-confirm">
                <span>Mevcut plan silinip yeniden hazırlanacak. Devam?</span>
                <button
                  className="button danger small"
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  aria-busy={generating}
                >
                  {generating ? 'Hazırlanıyor…' : 'Yeniden hazırla'}
                </button>
                <button
                  className="button ghost small"
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                className="button"
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                aria-busy={generating}
              >
                {generating
                  ? 'Plan hazırlanıyor…'
                  : hasPlan
                    ? 'Planı yeniden hazırla'
                    : 'Planı hazırla'}
              </button>
            )}

            {confirmTripDelete ? (
              <div className="inline-confirm">
                <span>Gezi silinsin mi?</span>
                <button
                  className="button danger small"
                  type="button"
                  disabled={deletingTrip}
                  onClick={handleDeleteTrip}
                >
                  {deletingTrip ? 'Siliniyor…' : 'Sil'}
                </button>
                <button
                  className="button ghost small"
                  type="button"
                  onClick={() => setConfirmTripDelete(false)}
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                className="button ghost danger"
                type="button"
                onClick={() => setConfirmTripDelete(true)}
              >
                Geziyi sil
              </button>
            )}
          </div>
        </div>

        <figure className="trip-photo">
          {heroImage ? (
            <img src={heroImage} alt={`${trip.destination} şehir görünümü`} />
          ) : (
            <div className="city-plate-inner">
              <span className="mono">ŞEHİR DOSYASI</span>
              <strong>{trip.destination}</strong>
              <span className="mono">
                {cityInitials(trip.destination)} / {String(trip.days.length).padStart(2, '0')} GÜN
              </span>
            </div>
          )}
          <figcaption>
            {trip.destination} / {String(trip.days.length).padStart(2, '0')} GÜN
          </figcaption>
        </figure>
      </header>

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

      <section className="budget-panel" aria-label="Bütçe özeti">
        <div>
          <p className="budget-label">
            {trip.budget === null ? 'TAHMİNİ TOPLAM' : overBudget ? 'BÜTÇE AŞIMI' : 'KALAN BÜTÇE'}
          </p>
          <p className={`budget-figure${overBudget ? ' is-over' : ''}`}>
            {formatMoney(trip.budget === null ? estimatedTotal : remaining, trip.currency)}
          </p>

          {trip.budget !== null && (
            <>
              <div
                className="budget-track"
                role="progressbar"
                aria-label="Bütçe kullanımı"
                aria-valuemin={0}
                aria-valuemax={trip.budget}
                aria-valuenow={Math.min(Math.round(estimatedTotal), trip.budget)}
              >
                <div
                  className={`budget-fill${overBudget ? ' is-over' : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="budget-meta">
                <span>Tahmini {formatMoney(estimatedTotal, trip.currency)}</span>
                <span>Bütçe {formatMoney(trip.budget, trip.currency)}</span>
              </div>
            </>
          )}
        </div>

        <div>
          <p className="budget-label">PLAN / DURUM</p>
          <p className="stat-line">
            <span>
              <strong>{activities.length}</strong> durak
            </span>
            <span>
              <strong>{trip.days.length}</strong> gün
            </span>
            <span>
              <strong>{emptyDays}</strong> boş gün
            </span>
          </p>

          {overBudget && (
            <p className="notice warning">
              Plan, bütçeni {formatMoney(Math.abs(remaining ?? 0), trip.currency)} aşıyor. Bir
              aktiviteyi çıkararak ya da daha ekonomik bir seçenekle dengeleyebilirsin.
            </p>
          )}
        </div>
      </section>

      {trip.tips.length > 0 && (
        <section className="tip-note" aria-label="Pratik notlar">
          <h2>Pratik notlar</h2>
          <ul>
            {trip.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="days" aria-label="Gün gün plan">
        {trip.days.map((day) => {
          const dayTotal = day.activities.reduce(
            (sum, activity) => sum + (activity.estimatedCost ?? 0),
            0,
          )
          const first = day.activities[0]
          const last = day.activities[day.activities.length - 1]
          const timeRange =
            first?.startTime && last?.endTime ? `${first.startTime}–${last.endTime}` : null

          return (
            <article className="day" key={day.id}>
              <div className="day-num" aria-hidden="true">
                {String(day.dayIndex).padStart(2, '0')}
              </div>

              <div>
                <header className="day-head">
                  <div>
                    <h2 className="day-title">{formatDate(day.date)}</h2>
                    <p className="day-summary">
                      {day.activities.length} durak
                      {timeRange ? ` · ${timeRange}` : ''} ·{' '}
                      {formatMoney(dayTotal, trip.currency)}
                    </p>
                  </div>
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => setOpenDayId(openDayId === day.id ? null : day.id)}
                    aria-expanded={openDayId === day.id}
                  >
                    {openDayId === day.id ? 'Kapat' : 'Durak ekle'}
                  </button>
                </header>

                {day.activities.length === 0 ? (
                  <p className="empty-inline">
                    Bu gün henüz boş. Planı hazırla ya da kendi durağını ekle.
                  </p>
                ) : (
                  <ol className="activity-list" role="list">
                    {day.activities.map((activity) => (
                      <li className="activity-card" key={activity.id}>
                        <span className="activity-check" aria-hidden="true">
                          ✓
                        </span>
                        <span className="activity-time">
                          {activity.startTime ?? '--:--'}
                          {activity.endTime ? `–${activity.endTime}` : ''}
                        </span>

                        <div className="activity-body">
                          <h3 className="activity-title">{activity.title}</h3>
                          <p className="activity-meta">
                            <span className={`category-tag ${activity.category}`}>
                              {CATEGORY_LABELS[activity.category] ?? activity.category}
                            </span>
                            {activity.place?.address && <span>{activity.place.address}</span>}
                          </p>
                        </div>

                        <span className="activity-price">
                          {activity.estimatedCost === null
                            ? ''
                            : activity.estimatedCost === 0
                              ? 'Ücretsiz'
                              : formatMoney(activity.estimatedCost, trip.currency)}
                        </span>

                        <div className="activity-actions">
                          {confirmActivityId === activity.id ? (
                            <div className="inline-confirm">
                              <button
                                className="button danger small"
                                type="button"
                                onClick={() => handleDeleteActivity(activity)}
                              >
                                Sil
                              </button>
                              <button
                                className="button ghost small"
                                type="button"
                                onClick={() => setConfirmActivityId(null)}
                              >
                                Vazgeç
                              </button>
                            </div>
                          ) : (
                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`${activity.title} aktivitesini sil`}
                              onClick={() => setConfirmActivityId(activity.id)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {openDayId === day.id && (
                  <ActivityForm
                    onSubmit={(input) => handleAddActivity(day.id, input)}
                    onCancel={() => setOpenDayId(null)}
                  />
                )}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
