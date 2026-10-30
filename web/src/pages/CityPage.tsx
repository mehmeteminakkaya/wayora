import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import { api } from '../api'
import type { CityDetail, CityExperience } from '../api'
import { BottomSheet } from '../components/BottomSheet'
import { CityEvents } from '../components/CityEvents'
import { Photo } from '../components/Photo'
import { DetailSkeleton } from '../components/Skeletons'
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
  const location = useLocation()
  const navigate = useNavigate()
  const fromExplore = Boolean(
    (location.state as { fromExplore?: boolean } | null)?.fromExplore,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [
    ...new Set((searchParams.get('selected') ?? '').split(',').filter(Boolean)),
  ])
  const [city, setCity] = useState<CityDetail | null>(null)
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rawFilter = searchParams.get('filter') as CityFilter | null
  const filter: CityFilter = FILTERS.some((item) => item.value === rawFilter)
    ? (rawFilter as CityFilter)
    : 'all'
  const [sheetOpen, setSheetOpen] = useState(false)
  const restoreFocusRef = useRef<HTMLButtonElement>(null)
  const closeSheet = useCallback(() => {
    setSheetOpen(false)
    window.setTimeout(() => restoreFocusRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const current = (searchParams.get('selected') ?? '').split(',').filter(Boolean)
    const next = selectedIds.join(',')
    if (current.join(',') === next) return
    const params = new URLSearchParams(searchParams)
    if (selectedIds.length > 0) params.set('selected', next)
    else params.delete('selected')
    setSearchParams(params, { replace: true })
  }, [selectedIds, searchParams, setSearchParams])

  useEffect(() => {
    if (selectedIds.length === 0 && sheetOpen) {
      // Seçimlerin tamamı kaldırıldığında açık özeti kapat.
      // oxlint-disable-next-line react/set-state-in-effect
      setSheetOpen(false)
    }
  }, [selectedIds.length, sheetOpen])

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
    return <DetailSkeleton />
  }

  if (error || !city) {
    return (
      <div className="page narrow">
        <button className="back-link" type="button" onClick={goBack}>
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          Keşfet
        </button>
        <p className="notice error" role="alert">
          {error ?? 'Şehir bulunamadı'}
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" type="button" onClick={() => window.location.reload()}>
            Tekrar dene
          </button>
          <Link className="btn btn-ghost" to="/kesfet">
            Tüm şehirlere dön
          </Link>
        </div>
      </div>
    )
  }

  const selectedTotal = selectedExperiences.reduce(
    (sum, experience) => sum + experience.estimatedCost,
    0,
  )
  const createTripPath = `/trips/new?destination=${encodeURIComponent(city.name)}&experiences=${encodeURIComponent(selectedIds.join(','))}`
  const hasSelection = selectedIds.length > 0

  function setFilter(value: CityFilter) {
    setSearchParams(
      (currentParams) => {
        if (value === 'all') currentParams.delete('filter')
        else currentParams.set('filter', value)
        return currentParams
      },
      { replace: true },
    )
  }

  function toggleExperience(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function goBack() {
    if (fromExplore) navigate(-1)
    else navigate('/kesfet')
  }

  return (
    <div className={`page${hasSelection ? ' with-sticky-action' : ''}`}>
      <button className="back-link" type="button" onClick={goBack}>
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
        Keşfet
      </button>

      <header className="city-hero">
        <Photo
          key={city.slug}
          className="city-hero-media"
          src={cityPhoto(city.name)}
          alt={`${city.name} şehir fotoğrafı`}
          label={cityPhotoLabel(city.name)}
          priority
        />
        <div className="city-hero-body">
          <p className="eyebrow">{city.country}</p>
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
        <>
        <p className="helper" style={{ marginTop: 12 }}>
          Küçük görseller kategori temsilidir; mekânın kendi fotoğrafı değildir.
        </p>
        <div className="experience-list">
          {visibleExperiences.map((experience) => {
            const selected = selectedIds.includes(experience.id)
            const detailPath = `/kesfet/${city.slug}/${experience.slug}`
            return (
              <article className="experience-row" key={experience.id}>
                <Link
                  to={detailPath}
                  state={{ fromCity: true }}
                  aria-label={`${experience.name} detayını aç`}
                >
                  <Photo
                    className="experience-thumb"
                    src={categoryPhoto(experience.category)}
                    alt={`Kategori görseli: ${categoryLabel(experience.category)}`}
                    label={categoryLabel(experience.category)}
                  />
                </Link>
                <div className="experience-row-body">
                  <h3>
                    <Link to={detailPath} state={{ fromCity: true }}>
                      {experience.name}
                    </Link>
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
                        <span>Katalog {experience.rating.toFixed(1)}</span>
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
        </>
      )}

      <CityEvents city={city.name} />

      {hasSelection && (
        <div className="sticky-action" aria-live="polite">
          <button
            className="selection-summary-button"
            type="button"
            ref={restoreFocusRef}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <span>
              {selectedIds.length} durak seçili
              <br />
              {priceText(selectedTotal, city.currency)} kişi başı
            </span>
            <span aria-hidden="true">Özeti aç</span>
          </button>
          <Link className="btn btn-primary" to={createTripPath}>
            Rotanı oluştur
          </Link>
        </div>
      )}

      <BottomSheet
        open={sheetOpen}
        title="Seçtiğin duraklar"
        onClose={closeSheet}
        footer={
          <>
            <span className="selection-count">
              {selectedExperiences.length} durak · {priceText(selectedTotal, city.currency)} kişi başı
            </span>
            <Link className="btn btn-primary" to={createTripPath}>
              Rotanı oluştur
            </Link>
          </>
        }
      >
        <div className="sheet-summary">
          <span className="small muted">Tahmini kişi başı toplam</span>
          <strong>{priceText(selectedTotal, city.currency)}</strong>
        </div>
        <div className="sheet-list">
          {selectedExperiences.map((experience) => (
            <div className="sheet-item" key={experience.id}>
              <div>
                <h3>{experience.name}</h3>
                <p>
                  {formatDuration(experience.durationMinutes)} ·{' '}
                  {priceText(experience.estimatedCost, experience.currency)}
                </p>
              </div>
              <button
                className="icon-btn"
                type="button"
                aria-label={`${experience.name} seçimini kaldır`}
                onClick={() => toggleExperience(experience.id)}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
