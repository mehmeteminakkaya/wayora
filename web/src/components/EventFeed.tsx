import { useState } from 'react'
import { CalendarDays, CalendarPlus, ExternalLink } from 'lucide-react'
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

function EventImage({ event }: { event: EventOffer }) {
  const [failed, setFailed] = useState(false)
  if (!event.imageUrl || failed) {
    return (
      <div className="event-image event-image-fallback" aria-hidden="true">
        <CalendarDays size={22} strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <div className="event-image">
      <img
        src={event.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function EventFeedRow({
  event,
  onAdd,
  canAdd,
}: {
  event: EventOffer
  onAdd?: (event: EventOffer) => void
  canAdd?: (event: EventOffer) => boolean
}) {
  const addAvailable = Boolean(onAdd && (!canAdd || canAdd(event)))
  return (
    <li className="event-row">
      <EventImage event={event} />
      <div className="event-body">
        <h4>{event.name}</h4>
        <p className="event-meta">
          <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
          {eventDate(event)}
          {event.venue ? ` · ${event.venue}` : ''}
        </p>
        <p className="event-price">{eventPrice(event)}</p>
      </div>
      <div className="event-actions">
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
        {addAvailable && (
          <button
            className="event-add"
            type="button"
            aria-label={`${event.name} etkinliğini güne ekle`}
            title="Aktif güne ekle"
            onClick={() => onAdd?.(event)}
          >
            <CalendarPlus size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  )
}

type EventFeedProps = {
  events: EventOffer[]
  loading?: boolean
  error?: string | null
  emptyText?: string
  onAdd?: (event: EventOffer) => void
  canAdd?: (event: EventOffer) => boolean
}

export function EventFeed({
  events,
  loading = false,
  error = null,
  emptyText = 'Bu tarihler için yaklaşan etkinlik bulunamadı.',
  onAdd,
  canAdd,
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
        <EventFeedRow event={event} key={event.id} onAdd={onAdd} canAdd={canAdd} />
      ))}
    </ul>
  )
}
