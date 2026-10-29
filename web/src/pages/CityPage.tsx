import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { api } from '../api'
import type { CityDetail, CityExperience } from '../api'
import { Photo } from '../components/Photo'
import { formatMoney } from '../lib/format'
import {
  categoryLabel,
  categoryPhoto,
  cityPhoto,
  cityPhotoLabel,
  normalizeCityKey,
} from '../lib/photos'

type CityFilter = 'all' | 'free' | 'history' | 'food' | 'night'

const FILTERS: Array<{ value: CityFilter; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'free', label: 'Ücretsiz' },
  { value: 'history', label: 'Tarih' },
  { value: 'food', label: 'Yemek' },
  { value: 'night', label: 'Gece' },
]

const NIGHT_TERMS = ['gece', 'gosteri', 'bar', 'muzik', 'aksam']

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} dk`
  if (rest === 0) return `${hours} saat`
  return `${hours} saat ${rest} dk`
}

function priceText(value: number, currency: string): string {
  return value === 0 ? 'Ücretsiz' : formatMoney(value, currency)
}

function isNightExperience(experience: CityExperience): boolean {
  if ((experience.category as string) === 'nightlife') return true
  const tags = experience.tags.map((tag) => normalizeCityKey(tag))
  return NIGHT_TERMS.some((term) => tags.includes(term))
}

function matchesFilter(experience: CityExperience, filter: CityFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'free') return experience.estimatedCost === 0
  if (filter === 'food') return experience.category === 'food'
  if (filter === 'night') return isNightExperience(experience)
  return experience.tags.some((tag) => normalizeCityKey(tag).includes('tarih'))
}

function shortDescription(text: string, maxLength = 84): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`
}

export function CityPage() {
  const { slug } = useParams<{ slug: string }>()
  const [city, setCity] = useState<CityDetail | null>(null)
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CityFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const visibleExperiences = useMemo(
    () => city?.experiences.filter((experience) => matchesFilter(experience, filter)) ?? [],
    [city, filter],
  )

  const selectedExperiences = useMemo(
    () => city?.experiences.filter((experience) => selectedIds.includes(experience.id)) ?? [],
    [city, selectedIds],
  )

  const loading = Boolean(slug) && requestedSlug !== slug

  if (!slug) {
    return (
      <div className="page narrow">
        <p className="notice error" role="alert">
          Şehir bulunamadı.
        </p>
        <Link className="btn btn-secondary" to="/kesfet">
          Keşfet sayfasına dön
        </Link>
      </div>
    )
  }

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
      <div className="page narrow">
        <Link className="back-link" to="/kesfet">
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          Keşfet
        </Link>
        <p className="notice error" role="alert">
          {error ?? 'Şehir bulunamadı'}
        </p>
        <Link className="btn btn-secondary" to="/kesfet">
          Tüm şehirlere dön
        </Link>
      </div>
    )
  }

  const selectedTotal = selectedExperiences.reduce(
    (sum, experience) => sum + experience.estimatedCost,
    0,
  )
  const createTripPath = `/trips/new?destination=${encodeURIComponent(city.name)}&experiences=${encodeURIComponent(selectedIds.join(','))}`
  const hasSelection = selectedIds.length > 0

  function toggleExperience(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div className={`page${hasSelection ? ' with-sticky-action' : ''}`}>
      <Link className="back-link" to="/kesfet">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
        Keşfet
      </Link>

      <header className="city-hero">
        <Photo
          key={city.slug}
          className="city-hero-media"
          src={cityPhoto(city.name)}
          alt={`${city.name} şehir fotoğrafı`}
          label={cityPhotoLabel(city.name)}
        />
        <div className="city-hero-body">
          <p className="label">{city.country}</p>
          <h1>{city.name}</h1>
          <p className="city-hero-meta">
            {city.experienceCount} deneyim · ort.{' '}
            {priceText(city.averageDailyCost, city.currency)}/gün {' · '}
            {city.bestSeason ?? 'Yıl boyu'}
          </p>
          <p className="city-hero-summary">{city.summary}</p>
        </div>
      </header>

      <section className="city-filter-bar" aria-label="Deneyim filtresi">
        <div className="chip-row" role="group" aria-label="Deneyimleri filtrele">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? 'chip is-active' : 'chip'}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {visibleExperiences.length === 0 ? (
        <p className="notice">
          Bu filtreyle eşleşen deneyim yok. Başka bir filtre seçmeyi dene.
        </p>
      ) : (
        <div className="experience-list">
          {visibleExperiences.map((experience) => {
            const selected = selectedIds.includes(experience.id)
            const detailPath = `/kesfet/${city.slug}/${experience.slug}`
            return (
              <article className="experience-row" key={experience.id}>
                <Link to={detailPath} aria-label={`${experience.name} detayını aç`}>
                  <Photo
                    className="experience-thumb"
                    src={categoryPhoto(experience.category)}
                    alt={`${experience.name}, ${categoryLabel(experience.category)}`}
                    label={categoryLabel(experience.category)}
                  />
                </Link>
                <div className="experience-row-body">
                  <h3>
                    <Link to={detailPath}>{experience.name}</Link>
                  </h3>
                  <p>{shortDescription(experience.description)}</p>
                  <div className="meta-line">
                    <span>{formatDuration(experience.durationMinutes)}</span>
                    <span className="dot" aria-hidden="true">
                      ·
                    </span>
                    <span>{priceText(experience.estimatedCost, experience.currency)}</span>
                    {experience.rating !== null && (
                      <>
                        <span className="dot" aria-hidden="true">
                          ·
                        </span>
                        <span>{experience.rating.toFixed(1)} / 5</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className={selected ? 'select-button is-selected' : 'select-button'}
                  type="button"
                  aria-pressed={selected}
                  aria-label={
                    selected
                      ? `${experience.name} seçimini kaldır`
                      : `${experience.name} durağını rotaya ekle`
                  }
                  onClick={() => toggleExperience(experience.id)}
                >
                  {selected ? (
                    <Check size={20} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Plus size={20} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </article>
            )
          })}
        </div>
      )}

      {hasSelection && (
        <div className="sticky-action" aria-live="polite">
          <span className="selection-count">
            {selectedIds.length} durak seçili
            <br />
            {priceText(selectedTotal, city.currency)} kişi başı
          </span>
          <Link className="btn btn-primary" to={createTripPath}>
            {city.name} rotası oluştur
          </Link>
        </div>
      )}
    </div>
  )
}
