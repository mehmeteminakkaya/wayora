import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { formatShortDate, todayIso } from '../lib/format'

const CITIES = ['İstanbul', 'Paris', 'Roma', 'Barselona', 'Londra', 'Amsterdam']
const CURRENCIES = ['EUR', 'USD', 'TRY']

export function NewTripPage() {
  const navigate = useNavigate()

  const [destination, setDestination] = useState('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(todayIso(7))
  const [endDate, setEndDate] = useState(todayIso(9))
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [notes, setNotes] = useState('')
  const [planAfterCreate, setPlanAfterCreate] = useState(true)
  const intentRef = useRef<'plan' | 'draft'>('plan')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function chooseIntent(intent: 'plan' | 'draft') {
    intentRef.current = intent
    setPlanAfterCreate(intent === 'plan')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const shouldGenerate = intentRef.current === 'plan'
    if (endDate < startDate) {
      setError('Bitiş tarihi başlangıçtan önce olamaz')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { trip } = await api.createTrip({
        title: title.trim() || `${destination.trim()} rotası`,
        destination: destination.trim(),
        startDate,
        endDate,
        budget: budget === '' ? null : Number(budget),
        currency,
        notes: notes.trim() || null,
      })

      if (shouldGenerate) {
        try {
          await api.generateTrip(trip.id)
        } catch {
          // Üretim başarısız olsa da gezi açılır; detay ekranında yeniden denenebilir.
        }
      }

      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gezi oluşturulamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YENİ ROTA / 02</p>
          <h1>Nereye, ne zaman?</h1>
          <p>Şehri ve tarihleri gir. Planı bir sonraki adımda oluşturacaksın.</p>
        </div>
      </div>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <div className="new-trip-grid">
        <form className="form form-panel" onSubmit={handleSubmit}>
          <label className="field">
            <span>Şehir</span>
            <input
              type="text"
              name="destination"
              list="sehirler"
              required
              minLength={2}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Örn. Paris"
              aria-describedby="destination-hint"
            />
            <datalist id="sehirler">
              {CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            <span className="field-hint" id="destination-hint">
              Hazır katalog: İstanbul, Paris, Roma, Barselona, Londra, Amsterdam. Diğer şehirler
              genel şablonla planlanır.
            </span>
          </label>

          <div className="two-column">
            <label className="field">
              <span>Başlangıç</span>
              <input
                type="date"
                name="startDate"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Bitiş</span>
              <input
                type="date"
                name="endDate"
                required
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <div className="two-column">
            <label className="field">
              <span>Bütçe (opsiyonel)</span>
              <input
                type="number"
                name="budget"
                min="0"
                step="10"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="Örn. 500"
              />
            </label>

            <label className="field">
              <span>Para birimi</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details className="details-block">
            <summary className="details-summary">İnce ayar: rota adı ve not</summary>
            <div className="form">
              <label className="field">
                <span>Rota adı</span>
                <input
                  type="text"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Boş bırakırsan şehir adıyla kaydedilir"
                />
              </label>

              <label className="field">
                <span>Not</span>
                <textarea
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Örn. Sabah erken başlamayı severim, müzeler öncelikli."
                />
              </label>
            </div>
          </details>

          <div className="form-actions">
            <button
              className="button"
              type="submit"
              disabled={busy}
              aria-busy={busy}
              onClick={() => chooseIntent('plan')}
            >
              {busy ? (planAfterCreate ? 'Plan hazırlanıyor…' : 'Oluşturuluyor…') : 'Oluştur ve planla'}
            </button>
            <button
              className="button ghost"
              type="submit"
              disabled={busy}
              onClick={() => chooseIntent('draft')}
            >
              Taslak olarak kaydet
            </button>
            <Link className="button ghost" to="/trips">
              Rotalara dön
            </Link>
          </div>
        </form>

        <aside className="draft-ticket" aria-label="Rota taslağı">
          <span className="stamp">TASLAK</span>
          <p className="eyebrow">ROTA TASLAĞI</p>
          <p className="draft-route">{destination.trim() || 'Şehir seç'}</p>
          <div className="draft-row">
            <span>Başlangıç</span>
            <strong>{formatShortDate(startDate)}</strong>
          </div>
          <div className="draft-row">
            <span>Bitiş</span>
            <strong>{formatShortDate(endDate)}</strong>
          </div>
          <div className="draft-row">
            <span>Bütçe</span>
            <strong>{budget === '' ? 'Belirtilmedi' : `${budget} ${currency}`}</strong>
          </div>
          <div className="draft-row">
            <span>Durum</span>
            <strong>Taslak</strong>
          </div>
          <p className="draft-foot">planla / düzenle / git</p>
        </aside>
      </div>
    </div>
  )
}
