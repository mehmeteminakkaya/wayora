import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { api } from '../api'
import type { DiscoveryStatus, EventOffer } from '../api'
import { EventFeed } from './EventFeed'
import { todayIso } from '../lib/format'

type CityEventsProps = {
  city: string
}

export function CityEvents({ city }: CityEventsProps) {
  const startDate = todayIso(0)
  const endDate = todayIso(60)
  const [status, setStatus] = useState<DiscoveryStatus | null>(null)
  const [events, setEvents] = useState<EventOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getDiscoveryStatus()
      .then((result) => {
        if (!active) return
        setStatus(result)
        if (result.providers.ticketmaster !== 'configured') return
        setLoading(true)
        api
          .listEvents(city, startDate, endDate)
          .then((response) => {
            if (active) setEvents(response.events)
          })
          .catch((err) => {
            if (active) setError(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi.')
          })
          .finally(() => {
            if (active) setLoading(false)
          })
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Keşif servisi yüklenemedi.')
      })
    return () => {
      active = false
    }
  }, [city, endDate, startDate])

  const missing = status?.providers.ticketmaster === 'missing'
  const pending = !status && !error

  return (
    <section className="city-events" aria-labelledby="city-events-title">
      <div className="section-head">
        <div>
          <p className="label">CANLI KEŞİF</p>
          <h2 id="city-events-title">Şehirde yaklaşan etkinlikler</h2>
        </div>
        <span className="provider-label">Ticketmaster · 60 gün</span>
      </div>
      <article className="discovery-panel">
        <div className="discovery-panel-head">
          <div>
            <p className="label">TICKETMASTER DISCOVERY</p>
            <h3>Etkinlikler</h3>
          </div>
          <CalendarDays size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : missing ? (
          <p className="discovery-empty">
            Canlı etkinlikler bu ortamda yapılandırılmadı. Anahtar eklendiğinde şehirdeki
            etkinlikler burada görünür.
          </p>
        ) : (
          <EventFeed
            events={events}
            loading={pending || loading}
            emptyText="Önümüzdeki 60 gün için etkinlik bulunamadı."
          />
        )}
        <p className="source-note">
          Etkinlik verisi Ticketmaster Discovery'dan gelir. Bilet işlemi Ticketmaster üzerinde
          tamamlanır; fiyat ve müsaitlik sağlayıcıda değişebilir.
        </p>
      </article>
    </section>
  )
}
