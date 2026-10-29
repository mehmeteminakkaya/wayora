import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { ActivityCategory, CityDetail } from '../api'
import { useAuth } from '../auth/AuthContext'
import { CATEGORY_LABELS, formatMoney } from '../lib/format'

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} dk`
  if (rest === 0) return `${hours} saat`
  return `${hours} saat ${rest} dk`
}

const PRICE_FILTERS = [
  { value: 'all', label: 'Tüm fiyatlar' },
  { value: 'free', label: 'Ücretsiz' },
  { value: 'under20', label: '20 € altı' },
  { value: 'over20', label: '20 € ve üzeri' },
] as const

type PriceFilter = (typeof PRICE_FILTERS)[number]['value']

export function CityPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [city, setCity] = useState<CityDetail | null>(null)
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<'all' | ActivityCategory>('all')
  const [price, setPrice] = useState<PriceFilter>('all')

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .getCity(slug)
      .then((result) => {
        if (active) {
          setCity(result.city)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setCity(null)
          setError(err instanceof Error ? err.message : 'Şehir rehberi yüklenemedi')
        }
      })
      .finally(() => {
        if (active) setRequestedSlug(slug)
      })
    return () => {
      active = false
    }
  }, [slug])

  const categories = useMemo(() => {
    if (!city) return []
    return [...new Set(city.experiences.map((experience) => experience.category))]
  }, [city])

  const visibleExperiences = useMemo(() => {
    if (!city) return []
    return city.experiences.filter((experience) => {
      if (category !== 'all' && experience.category !== category) return false
      if (price === 'free' && experience.estimatedCost !== 0) return false
      if (price === 'under20' && !(experience.estimatedCost > 0 && experience.estimatedCost < 20)) {
        return false
      }
      if (price === 'over20' && experience.estimatedCost < 20) return false
      return true
    })
  }, [city, category, price])

  const loading = requestedSlug !== slug

  if (loading) {
    return (
      <div className="center-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Rehber açılıyor…</span>
      </div>
    )
  }

  if (error || !city) {
    return (
      <div className="page-shell">
        <p className="notice error" role="alert">
          {error ?? 'Şehir bulunamadı'}
        </p>
        <Link className="button ghost" to="/kesfet">
          Tüm şehirlere dön
        </Link>
      </div>
    )
  }

  const createTripPath = `/trips/new?destination=${encodeURIComponent(city.name)}`

  return (
    <div className="page-shell city-guide-page">
      <Link className="back-link" to="/kesfet">
        TÜM ŞEHİRLER
      </Link>

      <header className="city-guide-hero">
        <div>
          <p className="eyebrow">
            KEŞİF / {city.country.toLocaleUpperCase('tr-TR')}
          </p>
          <h1>{city.name}</h1>
          <p className="city-guide-lead">{city.summary}</p>
          <div className="city-guide-actions">
            <Link className="button" to={createTripPath}>
              Bu şehirle rota oluştur
            </Link>
            <span className="mono">
              {city.experienceCount} deneyim · {formatMoney(city.averageCost, city.currency)} ortalama
            </span>
          </div>
        </div>
        <aside className="city-guide-ticket">
          <span className="stamp">ŞEHİR DOSYASI</span>
          <p className="city-ticket-name">{city.name}</p>
          <div className="city-ticket-row">
            <span>Ülke</span>
            <strong>{city.country}</strong>
          </div>
          <div className="city-ticket-row">
            <span>En iyi zaman</span>
            <strong>{city.bestSeason ?? 'Yıl boyu'}</strong>
          </div>
          <div className="city-ticket-row">
            <span>Başlangıç</span>
            <strong>{formatMoney(city.minCost, city.currency)}</strong>
          </div>
          <p className="hand">fiyatlar yaklaşık.</p>
        </aside>
      </header>

      <section className="guide-filters" aria-label="Deneyim filtreleri">
        <div className="filter-group">
          <span className="mono">TÜR</span>
          <div className="filter-row">
            <button
              className={category === 'all' ? 'filter-chip is-selected' : 'filter-chip'}
              type="button"
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
            >
              Tümü
            </button>
            {categories.map((item) => (
              <button
                className={category === item ? 'filter-chip is-selected' : 'filter-chip'}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                key={item}
              >
                {CATEGORY_LABELS[item] ?? item}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="mono">BÜTÇE</span>
          <div className="filter-row">
            {PRICE_FILTERS.map((item) => (
              <button
                className={price === item.value ? 'filter-chip is-selected' : 'filter-chip'}
                type="button"
                aria-pressed={price === item.value}
                onClick={() => setPrice(item.value)}
                key={item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="guide-result-head">
        <h2>{visibleExperiences.length} deneyim</h2>
        <span className="mono">
          {category === 'all' ? 'TÜM TÜRLER' : (CATEGORY_LABELS[category] ?? category).toLocaleUpperCase('tr-TR')}
        </span>
      </div>

      {visibleExperiences.length === 0 ? (
        <p className="notice">Bu filtreyle eşleşen deneyim yok. Filtreleri gevşetmeyi dene.</p>
      ) : (
        <div className="experience-list">
          {visibleExperiences.map((experience) => (
            <article className="experience-card" key={experience.id}>
              <div className="experience-card-head">
                <span className="stamp">{CATEGORY_LABELS[experience.category] ?? experience.category}</span>
                <span className="mono">
                  {formatDuration(experience.durationMinutes)} ·{' '}
                  {experience.estimatedCost === 0
                    ? 'Ücretsiz'
                    : formatMoney(experience.estimatedCost, experience.currency)}
                </span>
              </div>
              <h3>{experience.name}</h3>
              <p className="experience-description">{experience.description}</p>
              <div className="experience-meta">
                <span>{experience.neighborhood ?? 'Şehir merkezi'}</span>
                <span>{experience.rating ? `${experience.rating.toFixed(1)} / 5` : 'Yerel seçki'}</span>
                <span>{experience.priceNote ?? 'tahmini fiyat'}</span>
              </div>
              <div className="tag-row">
                {experience.tags.slice(0, 4).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <details className="experience-details">
                <summary>Pratik bilgi</summary>
                <p>{experience.address ?? 'Adres bilgisi için resmî kaynağa bakın.'}</p>
                <p>{experience.openingHours ?? 'Güncel saatleri kontrol edin.'}</p>
                {experience.bookingUrl && (
                  <a
                    className="text-link"
                    href={experience.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Resmî siteyi aç
                  </a>
                )}
              </details>
            </article>
          ))}
        </div>
      )}

      <p className="explore-disclaimer">
        {user
          ? 'Bu rehberdeki bir şehri seçip rota oluşturabilirsin. Planı oluşturduktan sonra durakları ekleyip çıkarabilirsin.'
          : 'Rota oluşturmak için giriş yapman yeterli. Keşif rehberi hesap açmadan da okunabilir.'}
      </p>
    </div>
  )
}
