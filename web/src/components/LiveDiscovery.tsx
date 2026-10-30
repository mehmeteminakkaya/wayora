import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plane, Ticket } from 'lucide-react'
import { api } from '../api'
import type { DiscoveryStatus, EventOffer, FlightSearchResult } from '../api'
import { formatMoney, formatShortDate } from '../lib/format'
import { EventFeed } from './EventFeed'

type LiveDiscoveryProps = {
  city: string
  startDate: string
  endDate: string
  activeDate?: string
  onAddEvent?: (event: EventOffer) => void
}

function flightTime(value: string | null): string {
  if (!value) return '--:--'
  return value.slice(11, 16)
}

function flightDate(value: string | null): string {
  if (!value) return 'Tarih yok'
  return formatShortDate(value.slice(0, 10))
}

export function LiveDiscovery({
  city,
  startDate,
  endDate,
  activeDate,
  onAddEvent,
}: LiveDiscoveryProps) {
  const [status, setStatus] = useState<DiscoveryStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [events, setEvents] = useState<EventOffer[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [origin, setOrigin] = useState('IST')
  const [flights, setFlights] = useState<FlightSearchResult | null>(null)
  const [flightsLoading, setFlightsLoading] = useState(false)
  const [flightsError, setFlightsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getDiscoveryStatus()
      .then((result) => {
        if (!active) return
        setStatus(result)
        if (result.providers.ticketmaster === 'configured') {
          setEventsLoading(true)
          api
            .listEvents(city, startDate, endDate)
            .then((response) => {
              if (active) setEvents(response.events)
            })
            .catch((error) => {
              if (active) {
                setEventsError(
                  error instanceof Error ? error.message : 'Etkinlikler yüklenemedi.',
                )
              }
            })
            .finally(() => {
              if (!active) return
              setEventsLoading(false)
              setEventsLoaded(true)
            })
        } else {
          setEventsLoaded(true)
        }
      })
      .catch((error) => {
        if (active) {
          setStatusError(error instanceof Error ? error.message : 'Keşif servisi yüklenemedi.')
        }
      })
    return () => {
      active = false
    }
  }, [city, endDate, startDate])

  async function handleFlightSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFlightsLoading(true)
    setFlightsError(null)
    try {
      const result = await api.searchFlights({
        origin: origin.trim().toUpperCase(),
        destination: city,
        departureDate: startDate,
        returnDate: endDate,
      })
      setFlights(result)
    } catch (error) {
      setFlights(null)
      setFlightsError(error instanceof Error ? error.message : 'Uçuşlar yüklenemedi.')
    } finally {
      setFlightsLoading(false)
    }
  }

  const ticketmasterMissing = status?.providers.ticketmaster === 'missing'
  const duffelMissing = status?.providers.duffel === 'missing'
  const statusPending = !status && !statusError

  // Sağlayıcı anahtarı yoksa demo/örnek içerik gösterilir; gerçek veri değildir.
  const demoEvents: EventOffer[] = [
    {
      id: 'demo-event-1',
      name: 'Şehir Caz Festivali',
      url: null,
      imageUrl: null,
      startDate,
      startTime: '20:00',
      venue: 'Harbiye Açıkhava',
      city: null,
      priceMin: 750,
      priceMax: 750,
      currency: 'TRY',
      status: null,
    },
    {
      id: 'demo-event-2',
      name: 'Boğaz’da Akustik Konser',
      url: null,
      imageUrl: null,
      startDate: endDate,
      startTime: '19:30',
      venue: 'Zorlu PSM',
      city: null,
      priceMin: 450,
      priceMax: 450,
      currency: 'TRY',
      status: null,
    },
  ]

  return (
    <section className="live-discovery" aria-labelledby="live-discovery-title">
      <div className="section-head">
        <div>
          <p className="label">CANLI KEŞİF</p>
          <h2 id="live-discovery-title">Şehrin gündemi</h2>
        </div>
        <span className="provider-label">Harici sağlayıcı</span>
      </div>

      {statusError && (
        <p className="notice error" role="alert">
          {statusError}
        </p>
      )}

      <div className="discovery-grid">
        <article className="discovery-panel" aria-labelledby="events-title">
          <div className="discovery-panel-head">
            <div>
              <p className="label">TICKETMASTER DISCOVERY</p>
              <h3 id="events-title">Etkinlikler</h3>
            </div>
            <Ticket size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>

          {statusError ? (
            <p className="discovery-empty">Sağlayıcı durumu alınamadı.</p>
          ) : statusPending ? (
            <EventFeed events={[]} loading />
          ) : ticketmasterMissing ? (
            <>
              <p className="test-label">
                Örnek veri · canlı etkinlikler için Ticketmaster anahtarı eklenmeli
              </p>
              <EventFeed events={demoEvents} />
            </>
          ) : (
            <EventFeed
              events={events}
              loading={eventsLoading || !eventsLoaded}
              error={eventsError}
              onAdd={onAddEvent}
              canAdd={(event) => Boolean(activeDate && event.startDate === activeDate)}
            />
          )}
          <p className="source-note">
            Etkinlik verisi Ticketmaster Discovery'dan gelir. Fiyat ve müsaitlik sağlayıcıda
            değişebilir; bilet işlemi Ticketmaster üzerinde tamamlanır.
          </p>
        </article>

        <article className="discovery-panel" aria-labelledby="flights-title">
          <div className="discovery-panel-head">
            <div>
              <p className="label">DUFFEL</p>
              <h3 id="flights-title">Uçuş fikri</h3>
            </div>
            <Plane size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>

          {statusError ? (
            <p className="discovery-empty">Sağlayıcı durumu alınamadı.</p>
          ) : statusPending ? (
            <div className="discovery-skeleton" role="status" aria-label="Uçuş servisi yükleniyor">
              <span className="skeleton-line medium" />
              <span className="skeleton-line short" />
            </div>
          ) : duffelMissing ? (
            <>
              <p className="test-label">
                Örnek veri · canlı uçuşlar için Duffel test token'ı eklenmeli
              </p>
              <ul className="flight-list">
                <li className="flight-row">
                  <div>
                    <strong>Türk Hava Yolları</strong>
                    <span>{formatShortDate(startDate)} · 09:30 → 11:00</span>
                    <span>Direkt · 1s 30dk</span>
                  </div>
                  <strong className="flight-price">{formatMoney(189, 'EUR')}</strong>
                </li>
              </ul>
            </>
          ) : (
            <form className="flight-form" onSubmit={handleFlightSearch}>
              <label className="field">
                <span>Kalkış havalimanı</span>
                <input
                  className="input"
                  type="text"
                  name="origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value.toUpperCase().slice(0, 3))}
                  placeholder="IST"
                  maxLength={3}
                  autoComplete="off"
                  aria-label="Kalkış havalimanı kodu"
                />
              </label>
              <button className="btn btn-secondary" type="submit" disabled={flightsLoading}>
                {flightsLoading ? 'Aranıyor...' : 'Uçuşları ara'}
              </button>
            </form>
          )}

          {flightsError && (
            <p className="notice error" role="alert">
              {flightsError}
            </p>
          )}

          {flights && (
            <>
              {flights.mode === 'test' && (
                <p className="test-label">Duffel test verisi · gerçek bilet değildir</p>
              )}
              {flights.offers.length === 0 ? (
                <p className="discovery-empty">Bu tarihler için uçuş bulunamadı.</p>
              ) : (
                <ul className="flight-list">
                  {flights.offers.map((offer) => (
                    <li className="flight-row" key={offer.id}>
                      <div>
                        <strong>{offer.airline ?? 'Havayolu'}</strong>
                        <span>
                          {flightDate(offer.departureAt)} · {flightTime(offer.departureAt)} →{' '}
                          {flightTime(offer.arrivalAt)}
                        </span>
                        <span>
                          {offer.from} → {offer.to} · {offer.stops === 0 ? 'Direkt' : `${offer.stops} aktarma`}
                        </span>
                      </div>
                      <strong className="flight-price">
                        {formatMoney(offer.price, offer.currency)}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
              <p className="source-note">{flights.disclaimer}</p>
            </>
          )}
          <p className="source-note">
            Uçuş yanıtı Duffel'dan gelir. Test modunda fiyatlar gerçek değildir; bu sürümde
            rezervasyon oluşturulmaz.
          </p>
        </article>
      </div>
    </section>
  )
}
