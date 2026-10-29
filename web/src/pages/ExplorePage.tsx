import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '../api'
import type { CityDetail, CityExperience, CitySummary } from '../api'
import { Photo } from '../components/Photo'
import { CardsSkeleton } from '../components/Skeletons'
import { formatMoney } from '../lib/format'
import { categoryLabel, cityPhoto, cityPhotoLabel, normalizeCityKey } from '../lib/photos'

type CategoryFilter = 'all' | 'food' | 'museum' | 'nature' | 'nightlife'
type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'name'

const CATEGORY_FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'food', label: 'Yemek' },
  { value: 'museum', label: 'Müze' },
  { value: 'nature', label: 'Doğa' },
  { value: 'nightlife', label: 'Gece' },
]

const NIGHT_TERMS = ['gece', 'gosteri', 'bar', 'muzik', 'aksam']

function isNightExperience(experience: CityExperience): boolean {
  if ((experience.category as string) === 'nightlife') return true
  const tags = experience.tags.map((tag) => normalizeCityKey(tag))
  return NIGHT_TERMS.some((term) => tags.includes(term))
}

function matchesCategory(experience: CityExperience, filter: CategoryFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'nightlife') return isNightExperience(experience)
  return experience.category === filter
}

function experienceSearchText(experience: CityExperience): string {
  return normalizeCityKey(
    [
      experience.name,
      experience.description,
      experience.neighborhood ?? '',
      experience.address ?? '',
      experience.category,
      categoryLabel(experience.category),
      ...experience.tags,
    ].join(' '),
  )
}

function citySearchText(city: CitySummary): string {
  return normalizeCityKey(
    [city.name, city.country, city.summary, city.bestSeason ?? '', ...city.tags].join(' '),
  )
}

function priceText(value: number, currency: string): string {
  return value === 0 ? 'Ücretsiz' : formatMoney(value, currency)
}

type CityResult = {
  city: CitySummary
  matchedExperiences: CityExperience[]
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cities, setCities] = useState<CitySummary[]>([])
  const [details, setDetails] = useState<Record<string, CityDetail>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(false)
  const detailsRequested = useRef(false)
  const restoreScroll = useRef(true)

  const query = searchParams.get('q') ?? ''
  const rawCategory = searchParams.get('category') as CategoryFilter | null
  const category: CategoryFilter = CATEGORY_FILTERS.some((item) => item.value === rawCategory)
    ? (rawCategory as CategoryFilter)
    : 'all'
  const rawSort = searchParams.get('sort') as SortKey | null
  const sort: SortKey =
    rawSort === 'price-asc' || rawSort === 'price-desc' || rawSort === 'name'
      ? rawSort
      : 'recommended'

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  function setQuery(value: string) {
    updateParam('q', value)
  }

  function setCategory(value: CategoryFilter) {
    updateParam('category', value === 'all' ? '' : value)
  }

  function setSort(value: SortKey) {
    updateParam('sort', value === 'recommended' ? '' : value)
  }

  useEffect(() => {
    let active = true
    api
      .listCities()
      .then((result) => {
        if (active) setCities(result.cities)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Şehir rehberi yüklenemedi')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (loading || !restoreScroll.current) return
    const saved = sessionStorage.getItem('wayora.explore.scroll')
    restoreScroll.current = false
    if (!saved) return
    sessionStorage.removeItem('wayora.explore.scroll')
    window.requestAnimationFrame(() => window.scrollTo({ top: Number(saved), behavior: 'auto' }))
  }, [loading])

  function ensureDetails() {
    if (detailsRequested.current || cities.length === 0) return
    detailsRequested.current = true
    setDetailsLoading(true)
    setDetailsError(false)
    Promise.allSettled(cities.map((city) => api.getCity(city.slug)))
      .then((results) => {
        const next: Record<string, CityDetail> = {}
        let failed = false
        results.forEach((result, index) => {
          const city = cities[index]
          if (result.status === 'fulfilled') {
            next[city.slug] = result.value.city
          } else {
            failed = true
          }
        })
        setDetails((current) => ({ ...current, ...next }))
        setDetailsError(failed)
      })
      .finally(() => {
        setDetailsLoading(false)
      })
  }

  const normalizedQuery = normalizeCityKey(query.trim())

  const results = useMemo(() => {
    const filtered: CityResult[] = []

    cities.forEach((city) => {
      const detail = details[city.slug]
      const experiences = detail?.experiences ?? []
      const cityMatchesQuery =
        normalizedQuery.length === 0 || citySearchText(city).includes(normalizedQuery)
      const matchedExperiences =
        normalizedQuery.length === 0
          ? []
          : experiences.filter(
              (experience) =>
                experienceSearchText(experience).includes(normalizedQuery) &&
                matchesCategory(experience, category),
            )
      const matchesFilter =
        category === 'all' ||
        !detail ||
        experiences.some((experience) => matchesCategory(experience, category))

      if ((cityMatchesQuery || matchedExperiences.length > 0) && matchesFilter) {
        filtered.push({ city, matchedExperiences })
      }
    })

    if (sort === 'price-asc') {
      filtered.sort(
        (a, b) =>
          a.city.averageCost - b.city.averageCost ||
          a.city.name.localeCompare(b.city.name, 'tr'),
      )
    } else if (sort === 'price-desc') {
      filtered.sort(
        (a, b) =>
          b.city.averageCost - a.city.averageCost ||
          a.city.name.localeCompare(b.city.name, 'tr'),
      )
    } else if (sort === 'name') {
      filtered.sort((a, b) => a.city.name.localeCompare(b.city.name, 'tr'))
    }

    return filtered
  }, [cities, details, normalizedQuery, category, sort])

  if (loading) {
    return (
      <div className="page">
        <header className="explore-head">
          <h1 className="explore-title">Keşfet</h1>
          <div className="skeleton skeleton-line" style={{ height: 48 }} />
          <div className="skeleton skeleton-line short" />
        </header>
        <CardsSkeleton count={3} />
      </div>
    )
  }

  const waitingForDetails = detailsLoading && Object.keys(details).length === 0
  const showEmpty = !waitingForDetails && results.length === 0

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="page">
      <header className="explore-head">
        <h1 className="explore-title">Keşfet</h1>

        <div className="search-box">
          <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          <input
            className="input"
            type="search"
            value={query}
            placeholder="Şehir veya deneyim ara"
            aria-label="Şehir veya deneyim ara"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value)
              ensureDetails()
            }}
          />
        </div>

        <div className="chip-row" role="group" aria-label="Kategori filtresi">
          {CATEGORY_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={category === item.value ? 'chip is-active' : 'chip'}
              aria-pressed={category === item.value}
              onClick={() => {
                setCategory(item.value)
                ensureDetails()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => {
              setError(null)
              setLoading(true)
              setReloadKey((value) => value + 1)
            }}
          >
            Tekrar dene
          </button>
        </div>
      )}

      {detailsError && (
        <p className="notice" role="status">
          Bazı deneyim bilgileri yüklenemedi; arama şehir bilgileriyle sınırlı.
        </p>
      )}

      <div className="explore-tools-row" style={{ marginBottom: 16 }}>
        <p className="label" aria-live="polite">
          {waitingForDetails ? 'ARANIYOR' : `${results.length} ŞEHİR`}
        </p>
        <select
          className="sort-select"
          value={sort}
          aria-label="Şehirleri sırala"
          onChange={(event) => setSort(event.target.value as SortKey)}
        >
          <option value="recommended">Önerilen sıra</option>
          <option value="price-asc">Fiyat: düşükten yükseğe</option>
          <option value="price-desc">Fiyat: yüksekten düşüğe</option>
          <option value="name">İsim: A-Z</option>
        </select>
      </div>

      {waitingForDetails ? (
        <CardsSkeleton count={2} />
      ) : showEmpty ? (
        <section className="empty-state" aria-live="polite">
          <h2>Sonuç bulunamadı.</h2>
          <p>
            {query.trim()
              ? `"${query.trim()}" için şehir veya deneyim bulunamadı.`
              : 'Bu kategoride şehir bulunamadı.'}{' '}
            Farklı bir arama dene veya filtreleri temizle.
          </p>
          <button className="btn btn-secondary" type="button" onClick={clearFilters}>
            Filtreleri temizle
          </button>
        </section>
      ) : (
        <div className="city-grid">
          {results.map(({ city, matchedExperiences }) => (
            <Link
              className="city-card"
              to={`/kesfet/${city.slug}`}
              state={{ fromExplore: true }}
              onClick={() => sessionStorage.setItem('wayora.explore.scroll', String(window.scrollY))}
              key={city.slug}
            >
              <Photo
                className="city-card-media"
                src={cityPhoto(city.name)}
                alt={`${city.name} şehir fotoğrafı`}
                label={cityPhotoLabel(city.name)}
              />
              <div className="city-card-body">
                <div className="city-card-title-row">
                  <h2 className="city-card-title">{city.name}</h2>
                  <span className="city-card-country">{city.country}</span>
                </div>
                <p className="city-card-meta">
                  {city.experienceCount} deneyim · ort.{' '}
                  {priceText(city.averageDailyCost, city.currency)}/gün ·{' '}
                  {city.bestSeason ?? 'Yıl boyu'}
                </p>
                {matchedExperiences.length > 0 && (
                  <p className="small muted">
                    Eşleşen: {matchedExperiences.slice(0, 2).map((item) => item.name).join(' · ')}
                    {matchedExperiences.length > 2
                      ? ` ve ${matchedExperiences.length - 2} deneyim daha`
                      : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
