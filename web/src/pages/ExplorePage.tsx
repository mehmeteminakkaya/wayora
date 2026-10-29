import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { CitySummary } from '../api'
import { formatMoney } from '../lib/format'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('')
}

export function ExplorePage() {
  const [cities, setCities] = useState<CitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

  if (loading) {
    return (
      <div className="center-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Şehirler hazırlanıyor…</span>
      </div>
    )
  }

  return (
    <div className="page-shell explore-page">
      <header className="explore-heading">
        <div>
          <p className="eyebrow">KEŞİF / 10 ŞEHİR</p>
          <h1>Şehri cebine sığdır.</h1>
          <p>
            Her şehir için müzeler, sokaklar, yemek durakları ve günübirlik rotalar. Fiyatlar
            kişi başı tahmini; planını kendi bütçene göre katmanla.
          </p>
        </div>
        <div className="explore-stamp" aria-label="Katalog özeti">
          <span className="stamp">10 ŞEHİR</span>
          <span className="stamp olive">100 DENEYİM</span>
          <span className="mono">FİYATLAR / EUR</span>
        </div>
      </header>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <div className="city-guide-grid">
        {cities.map((city) => (
          <Link className="city-guide-card" to={`/kesfet/${city.slug}`} key={city.slug}>
            <div className="city-guide-top">
              <span className="city-monogram" aria-hidden="true">
                {initials(city.name)}
              </span>
              <span className="stamp">{city.experienceCount} DENEYİM</span>
            </div>
            <h2>{city.name}</h2>
            <p className="city-guide-country">
              {city.country} · {city.bestSeason ?? 'Yıl boyu'}
            </p>
            <p className="city-guide-summary">{city.summary}</p>
            <div className="city-guide-meta">
              <span>{formatMoney(city.averageCost, city.currency)} ortalama</span>
              <span>{city.minCost === 0 ? 'ücretsiz seçenek var' : 'bütçe dostu'}</span>
            </div>
            <div className="tag-row" aria-label="Öne çıkan etiketler">
              {city.tags.slice(0, 3).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <span className="city-guide-link">Rehberi aç</span>
          </Link>
        ))}
      </div>

      <p className="explore-disclaimer">
        Fiyatlar 2026 sonbaharı için yaklaşık kişi başı değerlerdir. Müze saatleri, bilet
        koşulları ve sezonluk kapanışlar için resmî siteyi kontrol et.
      </p>
    </div>
  )
}
