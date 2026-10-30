import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { Pace } from '../api'
import { formatMoney, formatShortDate, titleCaseTr, todayIso, tripDayCount } from '../lib/format'

const CITIES = [
  'İstanbul',
  'Paris',
  'Roma',
  'Barselona',
  'Londra',
  'Amsterdam',
  'Berlin',
  'Prag',
  'Viyana',
  'Lizbon',
  'Madrid',
  'Floransa',
  'Venedik',
  'Atina',
]

const CURRENCIES = ['EUR', 'USD', 'TRY']

const PACE_OPTIONS: Array<{ value: Pace; label: string; hint: string }> = [
  { value: 'slow', label: 'Sakin', hint: 'Günde 2 durak' },
  { value: 'moderate', label: 'Dengeli', hint: 'Günde 3 durak' },
  { value: 'fast', label: 'Yoğun', hint: 'Günde 4 durak' },
]

const STEP_TITLES = ['Şehir', 'Tarih', 'Bütçe ve tempo']

const STEP_INTROS = [
  'Şehri seç. Katalogdaki 14 şehirde plan daha isabetli hazırlanır.',
  'Tarih aralığını gir ya da hızlı seçeneklerden birini kullan.',
  'Bütçe ve temponu belirle, özeti kontrol et. Plan gün gün hazırlanacak.',
]

type DatePreset = 'weekend' | 'three' | 'five' | 'flex' | null

function isoFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return isoFromDate(date)
}

function weekendDates(): { startDate: string; endDate: string } {
  const now = new Date()
  const day = now.getDay()
  const untilSaturday = (6 - day + 7) % 7
  const saturday = new Date(now)
  saturday.setDate(now.getDate() + untilSaturday)
  const sunday = new Date(saturday)
  sunday.setDate(saturday.getDate() + 1)
  return { startDate: isoFromDate(saturday), endDate: isoFromDate(sunday) }
}

function paceLabel(pace: Pace): string {
  return PACE_OPTIONS.find((option) => option.value === pace)?.label ?? 'Dengeli'
}

export function NewTripPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const destinationParam = searchParams.get('destination') ?? ''
  const selectedExperienceIds = [
    ...new Set(
      searchParams
        .getAll('experiences')
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]

  const [step, setStep] = useState(destinationParam ? 2 : 1)
  const [destination, setDestination] = useState(titleCaseTr(destinationParam))
  const [startDate, setStartDate] = useState(todayIso(7))
  const [endDate, setEndDate] = useState(todayIso(9))
  const [preset, setPreset] = useState<DatePreset>(null)
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [pace, setPace] = useState<Pace>('moderate')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'saving' | 'planning'>('idle')
  const [createdTripId, setCreatedTripId] = useState<string | null>(null)

  const dateFlexible = preset === 'flex'
  const dayCount = startDate && endDate ? tripDayCount(startDate, endDate) : 0

  function choosePreset(next: Exclude<DatePreset, null>) {
    setError(null)
    setPreset(next)
    if (next === 'weekend') {
      const weekend = weekendDates()
      setStartDate(weekend.startDate)
      setEndDate(weekend.endDate)
      return
    }
    if (next === 'three') {
      const start = todayIso(7)
      setStartDate(start)
      setEndDate(addDays(start, 2))
      return
    }
    if (next === 'five') {
      const start = todayIso(7)
      setStartDate(start)
      setEndDate(addDays(start, 4))
      return
    }
    const start = todayIso(7)
    setStartDate(start)
    setEndDate(addDays(start, 2))
  }

  function validateStep(current: number): string | null {
    if (current === 1 && destination.trim().length < 2) {
      return 'Şehir adı en az 2 karakter olmalı.'
    }
    if (current === 2) {
      if (!startDate || !endDate) return 'Başlangıç ve bitiş tarihi gerekli.'
      if (endDate < startDate) return 'Bitiş tarihi başlangıçtan önce olamaz.'
      if (tripDayCount(startDate, endDate) > 21) return 'Bir rota en fazla 21 gün olabilir.'
    }
    if (current === 3 && budget !== '') {
      const value = Number(budget)
      if (!Number.isFinite(value) || value < 0) return 'Bütçe negatif olamaz.'
      if (value > 1_000_000) return 'Bütçe en fazla 1.000.000 olabilir.'
    }
    return null
  }

  function selectCity(city: string) {
    setDestination(city)
    setError(null)
    if (step === 1) setStep(2)
  }

  function goNext() {
    const message = validateStep(step)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    if (step < 3) setStep(step + 1)
  }

  function goBack() {
    setError(null)
    if (step > 1) setStep(step - 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < 3) {
      goNext()
      return
    }

    const message = validateStep(3)
    if (message) {
      setError(message)
      return
    }
    if (busy || createdTripId) return

    setBusy(true)
    setPhase('saving')
    setError(null)

    let tripId: string | null = null
    try {
      const noteLines = [notes.trim(), `Tempo tercihi: ${paceLabel(pace)}`].filter(Boolean)
      const { trip } = await api.createTrip({
        title: title.trim() || `${titleCaseTr(destination)} rotası`,
        destination: titleCaseTr(destination),
        startDate,
        endDate,
        budget: budget === '' ? null : Number(budget),
        currency,
        notes: noteLines.join('\n'),
      })

      tripId = trip.id
      setCreatedTripId(trip.id)
      setPhase('planning')

      if (selectedExperienceIds.length > 0) {
        await api.importExperiences(trip.id, selectedExperienceIds)
      } else {
        await api.generateTrip(trip.id)
      }
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setPhase('idle')
      setError(
        tripId
          ? selectedExperienceIds.length > 0
            ? 'Rota kaydedildi ama seçili duraklar aktarılamadı. Seçimlerin duruyor; rotayı açıp yeniden deneyebilirsin.'
            : 'Rota oluşturuldu ama plan hazırlanamadı. Girdilerin duruyor; rotayı açıp yeniden deneyebilirsin.'
          : err instanceof Error
            ? err.message
            : 'Rota oluşturulamadı. Girdilerin duruyor; tekrar deneyebilirsin.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page narrow">
      <div className="wizard">
        <div className="wizard-progress" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <span key={item} className={item <= step ? 'step is-active' : 'step'} />
          ))}
        </div>
        <p className="eyebrow" aria-live="polite">
          Adım {step} / 3 · {STEP_TITLES[step - 1]}
        </p>

        <h1>Yeni rota</h1>
        <p className="helper">{STEP_INTROS[step - 1]}</p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <div className="wizard-step is-active">
              <div className="field">
                <span className="field-label">Popüler şehirler</span>
                <div
                  className="chip-row"
                  role="group"
                  aria-label="Popüler şehirler"
                  style={{ flexWrap: 'wrap', overflow: 'visible' }}
                >
                  {CITIES.map((city) => {
                    const selected =
                      destination.trim().toLocaleLowerCase('tr-TR') ===
                      city.toLocaleLowerCase('tr-TR')
                    return (
                      <button
                        key={city}
                        type="button"
                        className="chip"
                        aria-pressed={selected}
                        onClick={() => selectCity(city)}
                      >
                        {city}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="field">
                <span>Ya da başka bir şehir yaz</span>
                <input
                  className="input"
                  type="text"
                  name="destination"
                  list="sehirler"
                  required
                  minLength={2}
                  maxLength={120}
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Örn. Nice"
                  aria-describedby="destination-hint"
                />
                <datalist id="sehirler">
                  {CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <span className="helper" id="destination-hint">
                  Katalogdaki 14 şehirde plan daha isabetli hazırlanır. Diğer şehirler genel
                  şablonla planlanır.
                </span>
              </label>

              {selectedExperienceIds.length > 0 && (
                <div className="notice success">
                  <p className="small">
                    Şehir rehberinden {selectedExperienceIds.length} deneyim seçili geldi. Rota
                    oluşturulduğunda bu duraklar günlere dağıtılacak.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step is-active">
              <div className="quick-dates" role="group" aria-label="Hızlı tarih seçenekleri">
                <button
                  className={preset === 'weekend' ? 'chip is-active' : 'chip'}
                  type="button"
                  aria-pressed={preset === 'weekend'}
                  onClick={() => choosePreset('weekend')}
                >
                  Bu hafta sonu
                </button>
                <button
                  className={preset === 'three' ? 'chip is-active' : 'chip'}
                  type="button"
                  aria-pressed={preset === 'three'}
                  onClick={() => choosePreset('three')}
                >
                  3 gün
                </button>
                <button
                  className={preset === 'five' ? 'chip is-active' : 'chip'}
                  type="button"
                  aria-pressed={preset === 'five'}
                  onClick={() => choosePreset('five')}
                >
                  5 gün
                </button>
                <button
                  className={preset === 'flex' ? 'chip is-active' : 'chip'}
                  type="button"
                  aria-pressed={preset === 'flex'}
                  onClick={() => choosePreset('flex')}
                >
                  Tarihim belli değil
                </button>
              </div>

              <div className="date-grid">
                <label className="field">
                  <span>Başlangıç</span>
                  <input
                    className="input"
                    type="date"
                    name="startDate"
                    required
                    value={startDate}
                    onChange={(event) => {
                      const value = event.target.value
                      setStartDate(value)
                      setPreset(null)
                      if (endDate < value) setEndDate(value)
                    }}
                  />
                </label>

                <label className="field">
                  <span>Bitiş</span>
                  <input
                    className="input"
                    type="date"
                    name="endDate"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value)
                      setPreset(null)
                    }}
                  />
                </label>
              </div>

              {dateFlexible ? (
                <p className="notice">
                  Kesin tarih yoksa 3 günlük örnek tarihlerle başlarız:{' '}
                  {formatShortDate(startDate)} - {formatShortDate(endDate)}. Tarihleri istersen
                  yukarıdan değiştirebilirsin.
                </p>
              ) : (
                <p className="helper">
                  {startDate && endDate
                    ? `${formatShortDate(startDate)} - ${formatShortDate(endDate)} · ${dayCount} gün`
                    : 'Başlangıç ve bitiş tarihini seç.'}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step is-active">
              <div className="form-row">
                <label className="field">
                  <span>Toplam bütçe (opsiyonel)</span>
                  <input
                    className="input"
                    type="number"
                    name="budget"
                    min="0"
                    max="1000000"
                    step="10"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="Örn. 500"
                    aria-describedby="budget-hint"
                  />
                  <span className="helper" id="budget-hint">
                    Tüm gezi için toplam bütçe. Konaklama ve şehirler arası ulaşım dahil değil.
                  </span>
                </label>

                <label className="field">
                  <span>Para birimi</span>
                  <select
                    className="select"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    {CURRENCIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field">
                <span className="field-label">Tempo</span>
                <div className="pace-options">
                  {PACE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={pace === option.value ? 'chip is-active' : 'chip'}
                      type="button"
                      aria-pressed={pace === option.value}
                      onClick={() => setPace(option.value)}
                    >
                      {option.label} · {option.hint}
                    </button>
                  ))}
                </div>
                <span className="helper">Seçtiğin tempo plan notuna eklenir.</span>
              </div>

              <div className="summary-card" aria-label="Rota özeti">
                <div className="summary-row">
                  <span>Şehir</span>
                  <strong>{titleCaseTr(destination) || 'Belirtilmedi'}</strong>
                </div>
                <div className="summary-row">
                  <span>Tarih</span>
                  <strong>
                    {dateFlexible
                      ? `${formatShortDate(startDate)} - ${formatShortDate(endDate)} (örnek)`
                      : `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Süre</span>
                  <strong>{dayCount} gün</strong>
                </div>
                <div className="summary-row">
                  <span>Toplam bütçe</span>
                  <strong>
                    {budget === ''
                      ? 'Belirtilmedi'
                      : formatMoney(Number(budget), currency)}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Tempo</span>
                  <strong>{paceLabel(pace)}</strong>
                </div>
                {selectedExperienceIds.length > 0 && (
                  <div className="summary-row">
                    <span>Seçili deneyim</span>
                    <strong>{selectedExperienceIds.length}</strong>
                  </div>
                )}
              </div>

              {selectedExperienceIds.length > 0 && (
                <p className="helper">
                  Seçili deneyimler rota oluşturulurken günlere dağıtılacak. Planı daha sonra
                  düzenleyebilirsin.
                </p>
              )}

              <details className="summary-card">
                <summary className="field-label">Rota adı ve not (opsiyonel)</summary>
                <div className="form" style={{ marginTop: 12 }}>
                  <label className="field">
                    <span>Rota adı</span>
                    <input
                      className="input"
                      type="text"
                      name="title"
                      maxLength={120}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Boş bırakırsan şehir adıyla kaydedilir"
                    />
                  </label>

                  <label className="field">
                    <span>Not</span>
                    <textarea
                      className="textarea"
                      name="notes"
                      rows={3}
                      maxLength={900}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Örn. Sabah erken başlamayı severim, müzeler öncelikli."
                    />
                  </label>
                </div>
              </details>
            </div>
          )}

          {error && (
            <div className="notice error" role="alert">
              <p>{error}</p>
              {createdTripId && (
                <p>
                  <Link className="section-link" to={`/trips/${createdTripId}`}>
                    Oluşturulan rotayı aç
                  </Link>
                </p>
              )}
            </div>
          )}

          {phase !== 'idle' && (
            <div className="wizard-status" role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <span>
                {phase === 'saving'
                  ? 'Rota kaydediliyor...'
                  : selectedExperienceIds.length > 0
                    ? 'Seçtiğin duraklar rotaya aktarılıyor...'
                    : 'Plan hazırlanıyor...'}
              </span>
            </div>
          )}

          <div className="wizard-actions">
            {step > 1 ? (
              <button
                className="btn btn-secondary"
                type="button"
                disabled={busy}
                onClick={goBack}
              >
                Geri
              </button>
            ) : (
              <Link className="btn btn-secondary" to="/trips">
                Vazgeç
              </Link>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || createdTripId !== null}
              aria-busy={busy}
            >
              {busy
                ? phase === 'saving'
                  ? 'Rota kaydediliyor...'
                  : selectedExperienceIds.length > 0
                    ? 'Duraklar aktarılıyor...'
                    : 'Plan hazırlanıyor...'
                : createdTripId
                  ? 'Rota oluşturuldu'
                  : step < 3
                    ? 'Devam'
                    : 'Planı oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
