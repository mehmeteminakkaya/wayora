import { CalendarDays, ExternalLink } from 'lucide-react'
import type { EventOffer } from '../api'
import { formatMoney, formatShortDate } from '../lib/format'

function eventDate(event: EventOffer): string {
  if (!event.startDate) return 'Tarih belirtilmedi'
  const date = event.startDate.includes('T') ? event.startDate.slice(0, 10) : event.startDate
  const time = event.startTime?.slice(0, 5)
  return `${formatShortDate(date)}${time ? ` · ${time}` : ''}`
}

function eventPrice(event: EventOffer): string {
  if (event.priceMin === null || event.priceMax === null || !event.currency) {
    return 'Fiyat bilgisi yok'
  }
  if (event.priceMin === event.priceMax) return formatMoney(event.priceMin, event.currency)
  return `${formatMoney(event.priceMin, event.currency)} - ${formatMoney(event.priceMax, event.currency)}`
}

type EventFeedProps = {
  events: EventOffer[]
  loading?: boolean
  error?: string | null
  emptyText?: string
}

export function EventFeed({
  events,
  loading = false,
  error = null,
  emptyText = 'Bu tarihler için yaklaşan etkinlik bulunamadı.',
}: EventFeedProps) {
  if (loading) {
    return (
      <div className="discovery-skeleton" role="status" aria-label="Etkinlikler yükleniyor">
        <span className="skeleton-line medium" />
        <span className="skeleton-line" />
        <span className="skeleton-line short" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="notice error" role="alert">
        {error}
      </p>
    )
  }

  if (events.length === 0) {
    return <p className="discovery-empty">{emptyText}</p>
  }

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li className="event-row" key={event.id}>
          {event.imageUrl && (
            <img
              className="event-image"
              src={event.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(imageEvent) => {
                imageEvent.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="event-body">
            <h4>{event.name}</h4>
            <p className="event-meta">
              <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
              {eventDate(event)}
              {event.venue ? ` · ${event.venue}` : ''}
            </p>
            <p className="event-price">{eventPrice(event)}</p>
          </div>
          {event.url && (
            <a
              className="event-link"
              href={event.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${event.name} bilet sayfasını aç`}
            >
              <ExternalLink size={18} strokeWidth={1.75} />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
