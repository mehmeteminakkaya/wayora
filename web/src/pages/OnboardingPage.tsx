import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { BudgetLevel, Pace, PreferenceInput, TravelStyle } from '../api'

const INTERESTS = [
  'Müze',
  'Yemek',
  'Doğa',
  'Tarih',
  'Alışveriş',
  'Mimari',
  'Plaj',
  'Gece hayatı',
  'Sanat',
  'Fotoğraf',
]

const BUDGET_OPTIONS: Array<{ value: BudgetLevel; label: string; hint: string }> = [
  { value: 'low', label: 'Ekonomik', hint: 'Ücretsiz ve düşük maliyetli duraklar' },
  { value: 'mid', label: 'Dengeli', hint: 'Konfor ile bütçe arasında denge' },
  { value: 'high', label: 'Konforlu', hint: 'Deneyim odaklı, daha yüksek bütçe' },
]

const PACE_OPTIONS: Array<{ value: Pace; label: string; hint: string }> = [
  { value: 'slow', label: 'Yavaş', hint: 'Günde 2-3 durak, bol mola' },
  { value: 'moderate', label: 'Orta', hint: 'Günde 4-5 durak, dengeli tempo' },
  { value: 'fast', label: 'Hızlı', hint: 'Günde 6 ve üzeri durak' },
]

const TRAVEL_STYLE_BY_PACE: Record<Pace, TravelStyle> = {
  slow: 'relaxed',
  moderate: 'balanced',
  fast: 'packed',
}

const DEFAULTS: PreferenceInput = {
  interests: ['Müze', 'Yemek'],
  budgetLevel: 'mid',
  travelStyle: 'balanced',
  pace: 'moderate',
}

const STEP_TITLES = ['İlgi alanları', 'Bütçe', 'Tempo']

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/trips'
  const [form, setForm] = useState<PreferenceInput>(DEFAULTS)
  const [step, setStep] = useState(0)
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

  useEffect(() => {
    if (loading) return
    window.scrollTo(0, 0)
  }, [step, loading])

  function toggleInterest(interest: string) {
    setError(null)
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  function choosePace(pace: Pace) {
    setForm((current) => ({
      ...current,
      pace,
      travelStyle: TRAVEL_STYLE_BY_PACE[pace],
    }))
  }

  function goNext() {
    setError(null)
    if (step === 0 && form.interests.length < 2) {
      setError('En az 2 ilgi alanı seçmelisin.')
      return
    }
    setStep((current) => Math.min(2, current + 1))
  }

  function goBack() {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < 2) {
      goNext()
      return
    }
    if (form.interests.length < 2) {
      setStep(0)
      setError('En az 2 ilgi alanı seçmelisin.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.savePreferences(form)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tercihler kaydedilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page onboarding-page">
      <div className="onboarding-progress">
        <span className="label">Adım {step + 1} / 3</span>
        <div className="steps" aria-hidden="true">
          {STEP_TITLES.map((title, index) => (
            <span className={`step${index === step ? ' is-active' : ''}`} key={title} />
          ))}
        </div>
        <Link
          className="section-link"
          to={returnTo}
          aria-label="Tercihleri atlayıp devam et"
          style={{
            display: 'inline-flex',
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Atla
        </Link>
      </div>

      <header>
        <h1>Nasıl gezersin?</h1>
        <p className="muted">
          Üç kısa adımda ilgi alanlarını, bütçeni ve temponu seç. Sonra değiştirebilirsin.
        </p>
      </header>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="center-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Tercihler yükleniyor...</span>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit}>
          <section
            className={`onboarding-step${step === 0 ? ' is-active' : ''}`}
            aria-labelledby="step-interests"
          >
            <h2 id="step-interests">Neler ilgini çekiyor?</h2>
            <p className="small muted">
              En az 2 ilgi alanı seç. Wayora durakları buna göre önceliklendirir.
            </p>
            <div
              className="field"
              role="group"
              aria-labelledby="step-interests"
              aria-describedby="interest-count"
              style={{ marginTop: 16 }}
            >
              <div className="chip-row" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
                {INTERESTS.map((interest) => {
                  const selected = form.interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      type="button"
                      className="chip"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  )
                })}
              </div>
              <p className="helper" id="interest-count" aria-live="polite">
                {form.interests.length} / {INTERESTS.length} seçildi · en az 2
              </p>
            </div>
          </section>

          <section
            className={`onboarding-step${step === 1 ? ' is-active' : ''}`}
            aria-labelledby="step-budget"
          >
            <h2 id="step-budget">Bütçen nasıl?</h2>
            <p className="small muted">Günlük harcama aralığını seç.</p>
            <div
              className="choice-grid"
              role="group"
              aria-labelledby="step-budget"
              style={{ marginTop: 16 }}
            >
              {BUDGET_OPTIONS.map((option) => {
                const selected = form.budgetLevel === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`choice${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => {
                      setError(null)
                      setForm((current) => ({ ...current, budgetLevel: option.value }))
                    }}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      <span
                        className="helper"
                        style={{
                          display: 'block',
                          marginTop: 4,
                          color: selected ? 'var(--ink)' : undefined,
                        }}
                      >
                        {option.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section
            className={`onboarding-step${step === 2 ? ' is-active' : ''}`}
            aria-labelledby="step-pace"
          >
            <h2 id="step-pace">Hangi hızda gezersin?</h2>
            <p className="small muted">Günlük durak sayısı tempoya göre ayarlanır.</p>
            <div
              className="choice-grid"
              role="group"
              aria-labelledby="step-pace"
              style={{ marginTop: 16 }}
            >
              {PACE_OPTIONS.map((option) => {
                const selected = form.pace === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`choice${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => {
                      setError(null)
                      choosePace(option.value)
                    }}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      <span
                        className="helper"
                        style={{
                          display: 'block',
                          marginTop: 4,
                          color: selected ? 'var(--ink)' : undefined,
                        }}
                      >
                        {option.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="onboarding-foot">
            {step > 0 ? (
              <button
                className="btn btn-secondary"
                type="button"
                disabled={busy}
                onClick={goBack}
              >
                <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
                Geri
              </button>
            ) : (
              <span />
            )}

            {step < 2 ? (
              <button className="btn btn-primary" type="button" onClick={goNext}>
                Devam
                <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                type="submit"
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? 'Kaydediliyor...' : 'Tercihleri kaydet'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
