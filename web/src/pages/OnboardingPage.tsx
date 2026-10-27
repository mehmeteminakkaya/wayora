import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { BudgetLevel, Pace, PreferenceInput, TravelStyle } from '../api'

const INTERESTS = ['Müze', 'Yemek', 'Doğa', 'Tarih', 'Alışveriş', 'Mimari', 'Plaj', 'Gece hayatı']

const BUDGET_OPTIONS: Array<{ value: BudgetLevel; label: string; hint: string }> = [
  { value: 'low', label: 'Ekonomik', hint: 'Ücretsiz ve düşük maliyetli duraklar' },
  { value: 'mid', label: 'Dengeli', hint: 'Konfor ile bütçe arasında denge' },
  { value: 'high', label: 'Konforlu', hint: 'Deneyim odaklı, daha yüksek bütçe' },
]

const STYLE_OPTIONS: Array<{ value: TravelStyle; label: string }> = [
  { value: 'relaxed', label: 'Sakin' },
  { value: 'balanced', label: 'Dengeli' },
  { value: 'packed', label: 'Dolu dolu' },
]

const PACE_OPTIONS: Array<{ value: Pace; label: string }> = [
  { value: 'slow', label: 'Yavaş' },
  { value: 'moderate', label: 'Orta' },
  { value: 'fast', label: 'Hızlı' },
]

const DEFAULTS: PreferenceInput = {
  interests: ['Müze', 'Yemek'],
  budgetLevel: 'mid',
  travelStyle: 'balanced',
  pace: 'moderate',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PreferenceInput>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getPreferences()
      .then(({ preference }) => {
        if (!active) return
        setForm({
          interests: preference.interests,
          budgetLevel: preference.budgetLevel,
          travelStyle: preference.travelStyle,
          pace: preference.pace,
        })
      })
      .catch(() => {
        // Tercih yoksa varsayılanlarla devam et.
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function toggleInterest(interest: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.savePreferences(form)
      navigate('/trips')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tercihler kaydedilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-shell narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TERCİHLER / 01</p>
          <h1>Nasıl gezersin?</h1>
          <p>İlgi alanların, bütçen ve tempon planın sırasını belirler. Sonra değiştirebilirsin.</p>
        </div>
      </div>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="center-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Tercihler yükleniyor…</span>
        </div>
      ) : (
        <form className="form form-panel" onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend>İlgi alanların</legend>
            <p className="field-hint">En az bir tane seçmen planın sırasını netleştirir.</p>
            <div className="chip-row">
              {INTERESTS.map((interest) => {
                const selected = form.interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    className={selected ? 'chip-toggle is-selected' : 'chip-toggle'}
                    aria-pressed={selected}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Bütçe seviyesi</legend>
            <div className="option-grid">
              {BUDGET_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={form.budgetLevel === option.value ? 'option-card is-selected' : 'option-card'}
                >
                  <input
                    type="radio"
                    name="budgetLevel"
                    value={option.value}
                    checked={form.budgetLevel === option.value}
                    onChange={() => setForm((current) => ({ ...current, budgetLevel: option.value }))}
                  />
                  <span className="option-title">{option.label}</span>
                  <span className="option-hint">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="two-column">
            <label className="field">
              <span>Seyahat tarzı</span>
              <select
                value={form.travelStyle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    travelStyle: event.target.value as TravelStyle,
                  }))
                }
              >
                {STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tempo</span>
              <select
                value={form.pace}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pace: event.target.value as Pace }))
                }
              >
                {PACE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button className="button" type="submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Kaydediliyor…' : 'Planlamaya başla'}
            </button>
            <Link className="button ghost" to="/trips">
              Şimdilik geç
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
