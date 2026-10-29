import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../api'
import type { CityDetail } from '../api'
import { Photo } from '../components/Photo'
import { formatMoney } from '../lib/format'
import { categoryLabel, cityCoords, cityPhoto, cityPhotoLabel } from '../lib/photos'

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

function MapBlock({ cityName }: { cityName: string }) {
  const [lat, lng] = cityCoords(cityName)
  const delta = 0.02
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta]
    .map((value) => value.toFixed(5))
    .join(',')
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`
  const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`

  return (
    <section className="info-block" aria-labelledby="harita-baslik">
      <h2 id="harita-baslik">Harita</h2>
      <div className="map-frame">
        <iframe
          src={embedSrc}
          title={`${cityName} haritası`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        Harita yüklenmezse{' '}
        <a className="section-link" href={mapLink} target="_blank" rel="noreferrer">
          OpenStreetMap&apos;te aç
        </a>
        .
      </p>
    </section>
  )
}

export function ExperiencePage() {
  const params = useParams<{
    slug?: string
    experience?: string
    citySlug?: string
    experienceSlug?: string
  }>()
  const citySlug = params.citySlug ?? params.slug
  const experienceSlug = params.experienceSlug ?? params.experience
  const [city, setCity] = useState<CityDetail | null>(null)
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citySlug) return
    let active = true
    api
      .getCity(citySlug)
      .then((result) => {
        if (active) {
          setCity(result.city)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setCity(null)
          setError(err instanceof Error ? err.message : 'Deneyim yüklenemedi')
        }
      })
      .finally(() => {
        if (active) setRequestedSlug(citySlug)
      })
    return () => {
      active = false
    }
  }, [citySlug])

  const loading = Boolean(citySlug) && requestedSlug !== citySlug

  if (!citySlug || !experienceSlug) {
    return (
      <div className="page narrow">
        <p className="notice error" role="alert">
          Deneyim bulunamadı.
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
        <span>Deneyim açılıyor…</span>
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
          {error ?? 'Deneyim yüklenemedi'}
        </p>
        <Link className="btn btn-secondary" to="/kesfet">
          Tüm şehirlere dön
        </Link>
      </div>
    )
  }

  const experience = city.experiences.find((item) => item.slug === experienceSlug)

  if (!experience) {
    return (
      <div className="page narrow">
        <Link className="back-link" to={`/kesfet/${city.slug}`}>
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          {city.name}
        </Link>
        <section className="empty-state">
          <h2>Deneyim bulunamadı.</h2>
          <p>Bu deneyim şehir rehberinde yok. Şehir sayfasından başka bir durak seçebilirsin.</p>
          <Link className="btn btn-secondary" to={`/kesfet/${city.slug}`}>
            {city.name} rehberine dön
          </Link>
        </section>
      </div>
    )
  }

  const area = experience.neighborhood ?? experience.address
  const transportText = area ? `${city.name} · ${area}` : city.name

  return (
    <div className="page with-sticky-action">
      <Link className="back-link" to={`/kesfet/${city.slug}`}>
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
        {city.name}
      </Link>

      <header className="experience-hero">
        <Photo
          key={`${city.slug}-${experience.slug}`}
          className="experience-hero-media"
          src={cityPhoto(city.name)}
          alt={`${city.name} şehir fotoğrafı`}
          label={cityPhotoLabel(city.name)}
        />
        <div className="experience-hero-body city-hero-body">
          <p className="label">{categoryLabel(experience.category)}</p>
          <h1 className="experience-detail-title">{experience.name}</h1>
          <p className="experience-detail-meta">
            <span>{city.name}</span>
            <span className="dot" aria-hidden="true">
              ·
            </span>
            <span>{experience.neighborhood ?? city.country}</span>
          </p>
          <p className="experience-detail-description">{experience.description}</p>

          <div className="fact-grid">
            <div className="fact">
              <span className="label">Süre</span>
              <strong>{formatDuration(experience.durationMinutes)}</strong>
            </div>
            <div className="fact">
              <span className="label">Fiyat</span>
              <strong>{priceText(experience.estimatedCost, experience.currency)}</strong>
            </div>
            <div className="fact">
              <span className="label">Puan</span>
              <strong>
                {experience.rating !== null ? `${experience.rating.toFixed(1)} / 5` : 'Puan yok'}
              </strong>
            </div>
            <div className="fact">
              <span className="label">Bölge</span>
              <strong>{experience.neighborhood ?? city.name}</strong>
            </div>
          </div>
        </div>
      </header>

      <MapBlock cityName={city.name} />

      <section className="info-block" aria-labelledby="bilmen-baslik">
        <h2 id="bilmen-baslik">Bilmen gerekenler</h2>
        <ul className="info-list">
          <li>
            <span>En iyi zaman</span>
            <strong>{city.bestSeason ?? 'Yıl boyu'}</strong>
          </li>
          <li>
            <span>Açılış saatleri</span>
            <strong>{experience.openingHours ?? 'Güncel saatleri kontrol et'}</strong>
          </li>
          <li>
            <span>Ulaşım</span>
            <strong>{transportText}</strong>
          </li>
          <li>
            <span>Rezervasyon</span>
            <strong>
              {experience.bookingUrl ? (
                <a href={experience.bookingUrl} target="_blank" rel="noreferrer">
                  Resmî siteyi aç
                </a>
              ) : (
                'Bağlantı yok'
              )}
            </strong>
          </li>
        </ul>
      </section>

      <div className="sticky-action">
        <span className="price">
          {priceText(experience.estimatedCost, experience.currency)}
          <span className="small muted"> / kişi</span>
        </span>
        <Link
          className="btn btn-primary"
          to={`/trips/new?destination=${encodeURIComponent(city.name)}&experiences=${encodeURIComponent(experience.id)}`}
        >
          Plana ekle
        </Link>
      </div>
    </div>
  )
}
