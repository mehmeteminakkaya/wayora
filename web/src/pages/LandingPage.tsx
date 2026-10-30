import { ArrowRight, Check, Search } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Photo } from '../components/Photo'
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
]

const STEPS = [
  {
    title: 'Şehri seç',
    text: 'Berlin, Roma, Lizbon ve yedi şehir daha. Tarihlerini sen belirle.',
  },
  {
    title: 'Tercihlerini söyle',
    text: 'İlgi alanların, bütçen ve tempon üç kısa adımda kaydedilir.',
  },
  {
    title: 'Planını al',
    text: 'Wayora günleri saat saat sıralar. İstediğin durağı değiştirirsin.',
  },
]

const SAMPLE_STOPS = [
  { time: '09:30', title: 'East Side Gallery', price: 'Ücretsiz' },
  { time: '12:30', title: 'Markthalle Neun', price: '14 €' },
  { time: '15:00', title: 'Tempelhofer Feld', price: 'Ücretsiz' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [destination, setDestination] = useState('')

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const city = destination.trim()
    navigate(city ? `/trips/new?destination=${encodeURIComponent(city)}` : '/trips/new')
  }

  return (
    <div className="landing-page">
      <section className="landing-hero page" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow landing-kicker">SEYAHAT PLANLAMA</p>
          <h1 className="landing-title" id="landing-title">
            Bir şehir seç. Günlerini Wayora sıralasın.
          </h1>
          <p className="landing-lead">
            İlgi alanlarını, bütçeni ve temponu söyle. Wayora şehri günlere, günleri saatlere
            böler. Planı hazır bırakmaz, düzenlemen için eline verir.
          </p>

          <form className="hero-search" role="search" onSubmit={handleSearch}>
            <label className="field-label" htmlFor="landing-city">
              Şehir
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
                aria-label="Şehir ara"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Şehir ara: Berlin, Roma, Lizbon..."
              />
            </div>

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
              {user ? 'Rotanı planla' : 'Planı başlat'}
              <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>

          <p className="hero-stat">10 şehir · 100 deneyim · ücretsiz</p>
          {user && (
            <Link className="section-link" to="/trips">
              Rotalarıma dön
            </Link>
          )}
        </div>

        <div className="landing-hero-media">
          <Photo
            src={cityPhoto('Berlin')}
            alt="Berlin'de sokak ve şehir görünümü"
            label={cityPhotoLabel('Berlin')}
            priority
          />
        </div>
      </section>

      <div className="page">
        <section className="section" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title">Nasıl çalışır</h2>
          </div>
          <div className="how-list">
            {STEPS.map((step, index) => (
              <article className="how-item" key={step.title}>
                <span className="how-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="cities-title">
          <div className="section-head">
            <h2 id="cities-title">Şehirler</h2>
            <Link
              className="section-link"
              to="/kesfet"
              style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
            >
              Tüm şehirler
            </Link>
          </div>
          <div className="city-rail">
            {CITIES.map((city) => (
              <Link className="city-card" to={`/kesfet/${citySlug(city.name)}`} key={city.name}>
                <Photo
                  className="city-card-media"
                  src={cityPhoto(city.name)}
                  alt={`${city.name} şehir görünümü`}
                  label={cityPhotoLabel(city.name)}
                />
                <div className="city-card-body">
                  <div className="city-card-title-row">
                    <h3 className="city-card-title">{city.name}</h3>
                    <span className="city-card-country">{city.country}</span>
                  </div>
                  <p className="city-card-meta">10 deneyim</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="sample-title">
          <div className="section-head">
            <h2 id="sample-title">Örnek bir gün</h2>
            <span className="small muted">Berlin · 3 durak</span>
          </div>
          <div className="sample-day" aria-label="Berlin için örnek gün planı">
            <div className="sample-day-head">
              <span>BERLİN / GÜN 01</span>
              <span>09:30-17:00</span>
            </div>
            {SAMPLE_STOPS.map((stop) => (
              <div className="sample-row" key={stop.time}>
                <time>{stop.time}</time>
                <strong>{stop.title}</strong>
                <span>{stop.price}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
