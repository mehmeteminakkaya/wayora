import { ArrowRight, Check, Search } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Photo } from '../components/Photo'
import { useLang } from '../i18n.tsx'
import type { TranslationKey } from '../i18n.tsx'
import { cityPhoto, cityPhotoLabel, citySlug } from '../lib/photos'

const CITIES = [
  { name: 'Berlin', country: 'Almanya' },
  { name: 'Roma', country: 'İtalya' },
  { name: 'Lizbon', country: 'Portekiz' },
  { name: 'Paris', country: 'Fransa' },
  { name: 'Barselona', country: 'İspanya' },
  { name: 'Amsterdam', country: 'Hollanda' },
  { name: 'İstanbul', country: 'Türkiye' },
  { name: 'Londra', country: 'Birleşik Krallık' },
  { name: 'Prag', country: 'Çekya' },
  { name: 'Viyana', country: 'Avusturya' },
  { name: 'Madrid', country: 'İspanya' },
  { name: 'Floransa', country: 'İtalya' },
  { name: 'Venedik', country: 'İtalya' },
  { name: 'Atina', country: 'Yunanistan' },
]

const COUNTRY_EN: Record<string, string> = {
  Almanya: 'Germany',
  İtalya: 'Italy',
  Portekiz: 'Portugal',
  Fransa: 'France',
  İspanya: 'Spain',
  Hollanda: 'Netherlands',
  Türkiye: 'Türkiye',
  'Birleşik Krallık': 'United Kingdom',
  Çekya: 'Czechia',
  Avusturya: 'Austria',
  Yunanistan: 'Greece',
}

type Step = { titleKey: TranslationKey; textKey: TranslationKey }

const STEPS: Step[] = [
  { titleKey: 'landing.step1Title', textKey: 'landing.step1Text' },
  { titleKey: 'landing.step2Title', textKey: 'landing.step2Text' },
  { titleKey: 'landing.step3Title', textKey: 'landing.step3Text' },
]

type SampleStop = { time: string; title?: string; titleKey?: TranslationKey; price: string | null }

const SAMPLE_STOPS: SampleStop[] = [
  { time: '09:30', title: 'East Side Gallery', price: null },
  { time: '12:30', title: 'Markthalle Neun', price: '14 €' },
  { time: '15:00', title: 'Tempelhofer Feld', price: null },
  { time: '17:30', title: 'Hackescher Markt', price: null },
  { time: '19:30', titleKey: 'landing.sampleDinner', price: '22 €' },
]

const SAMPLE_POINTS: TranslationKey[] = [
  'landing.samplePoint1',
  'landing.samplePoint2',
  'landing.samplePoint3',
]

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang, t } = useLang()
  const [destination, setDestination] = useState('')

  const countryLabel = (country: string) =>
    lang === 'en' ? (COUNTRY_EN[country] ?? country) : country

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const city = destination.trim()
    navigate(city ? `/trips/new?destination=${encodeURIComponent(city)}` : '/trips/new')
  }

  return (
    <div className="landing-page">
      <section className="landing-hero page" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow landing-kicker">{t('landing.kicker')}</p>
          <h1 className="landing-title" id="landing-title">
            {t('landing.title')}
          </h1>
          <p className="landing-lead">{t('landing.lead')}</p>

          <form className="hero-search" role="search" onSubmit={handleSearch}>
            <label className="field-label" htmlFor="landing-city">
              {t('landing.city')}
            </label>
            <div className="search-box">
              {destination.trim() ? (
                <Check size={24} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Search size={24} strokeWidth={1.75} aria-hidden="true" />
              )}
              <input
                className="input"
                id="landing-city"
                name="city"
                type="text"
                autoComplete="off"
                aria-label={t('landing.searchAria')}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder={t('landing.cityPlaceholder')}
              />
            </div>

            <div className="field">
              <span className="field-label">{t('landing.popular')}</span>
              <div
                className="chip-row"
                role="group"
                aria-label={t('landing.popular')}
                style={{ flexWrap: 'wrap', overflow: 'visible' }}
              >
                {CITIES.map((city) => {
                  const selected =
                    destination.trim().toLocaleLowerCase('tr-TR') ===
                    city.name.toLocaleLowerCase('tr-TR')
                  return (
                    <button
                      key={city.name}
                      type="button"
                      className="chip"
                      aria-pressed={selected}
                      onClick={() => setDestination(city.name)}
                    >
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {selected && (
                          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                        )}
                        {city.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button className="btn btn-primary btn-block" type="submit">
              {user ? t('landing.cta') : t('landing.ctaGuest')}
              <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>

          <p className="hero-stat">{t('landing.stat')}</p>
          {user && (
            <Link className="section-link" to="/trips">
              {t('landing.backToTrips')}
            </Link>
          )}
        </div>

        <div className="landing-hero-media">
          <Photo
            src={cityPhoto('Berlin')}
            alt="Berlin street and city view"
            label={cityPhotoLabel('Berlin')}
            priority
          />
        </div>
      </section>

      <div className="page">
        <section className="section" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title">{t('landing.howTitle')}</h2>
          </div>
          <div className="how-list">
            {STEPS.map((step, index) => (
              <article className="how-item" key={step.titleKey}>
                <span className="how-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{t(step.titleKey)}</h3>
                  <p>{t(step.textKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="cities-title">
          <div className="section-head">
            <h2 id="cities-title">{t('landing.citiesTitle')}</h2>
            <Link
              className="section-link"
              to="/kesfet"
              style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
            >
              {t('landing.allCities')}
            </Link>
          </div>
          <div className="city-rail">
            {CITIES.map((city) => (
              <Link className="city-card" to={`/kesfet/${citySlug(city.name)}`} key={city.name}>
                <Photo
                  className="city-card-media"
                  src={cityPhoto(city.name)}
                  alt={`${city.name} city view`}
                  label={cityPhotoLabel(city.name)}
                />
                <div className="city-card-body">
                  <div className="city-card-title-row">
                    <h3 className="city-card-title">{city.name}</h3>
                    <span className="city-card-country">{countryLabel(city.country)}</span>
                  </div>
                  <p className="city-card-meta">{t('landing.experiences')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section sample-section" aria-labelledby="sample-title">
          <div className="sample-copy">
            <p className="eyebrow">{t('landing.sampleKicker')}</p>
            <h2 id="sample-title">{t('landing.sampleTitle')}</h2>
            <p className="muted">{t('landing.sampleLead')}</p>
            <ul className="sample-points">
              {SAMPLE_POINTS.map((point) => (
                <li key={point}>{t(point)}</li>
              ))}
            </ul>
            <Link className="btn btn-primary" to="/trips/new">
              {t('landing.sampleCta')}
            </Link>
          </div>
          <div className="sample-day" aria-label={t('landing.sampleDayLabel')}>
            <div className="sample-day-head">
              <span>{t('landing.sampleDayHead')}</span>
              <span>09:30-19:30</span>
            </div>
            {SAMPLE_STOPS.map((stop) => (
              <div className="sample-row" key={stop.time}>
                <time>{stop.time}</time>
                <strong>{stop.titleKey ? t(stop.titleKey) : stop.title}</strong>
                <span>{stop.price ?? t('common.free')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
