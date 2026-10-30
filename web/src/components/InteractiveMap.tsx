import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// Vite bundle'ında worker'ın doğru URL'den yüklenmesi için açıkça verilir.
maplibregl.setWorkerUrl(workerUrl)

export type MapPoint = {
  id: string
  lat: number
  lng: number
  label: string
  detail?: string | null
}

type Props = {
  center: [number, number] // [lat, lng]
  points?: MapPoint[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  zoom?: number
  title: string
  height?: number
}

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

function markerEl(index: number, active: boolean): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.textContent = String(index)
  el.style.cssText = [
    'width:30px',
    'height:30px',
    'border-radius:50%',
    `background:${active ? '#FFC400' : '#121212'}`,
    `color:${active ? '#121212' : '#fff'}`,
    'border:2px solid #fff',
    'font:700 13px Overpass,sans-serif',
    'cursor:pointer',
    'box-shadow:0 1px 4px rgba(0,0,0,.35)',
    `transform:scale(${active ? 1.25 : 1})`,
    'transition:transform .15s',
  ].join(';')
  return el
}

export function InteractiveMap({
  center,
  points = [],
  selectedId = null,
  onSelect,
  zoom = 13,
  title,
  height = 360,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [failed, setFailed] = useState(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!host.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: host.current,
        style: STYLE_URL,
        center: [center[1], center[0]],
        zoom,
        attributionControl: { compact: true },
      })
    } catch {
      // WebGL yoksa (eski cihaz, test ortamı) harita yerine bağlantı gösterilir.
      setFailed(true)
      return
    }
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({ trackUserLocation: false }),
      'top-right',
    )
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    mapRef.current = map
    return () => {
      markers.current.forEach((m) => m.remove())
      markers.current = []
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current = []
    const bounds = new maplibregl.LngLatBounds()
    points.forEach((p, i) => {
      const el = markerEl(i + 1, p.id === selectedId)
      el.setAttribute('aria-label', p.label)
      el.addEventListener('click', () => onSelectRef.current?.(p.id))
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, closeButton: false }).setDOMContent(
            popupContent(p),
          ),
        )
        .addTo(map)
      markers.current.push(marker)
      bounds.extend([p.lng, p.lat])
    })
    const selected = points.find((p) => p.id === selectedId)
    if (selected) {
      map.flyTo({ center: [selected.lng, selected.lat], zoom: Math.max(map.getZoom(), 15), speed: 1.3 })
      const idx = points.indexOf(selected)
      markers.current[idx]?.togglePopup()
    } else if (points.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 })
    } else if (points.length === 1) {
      map.flyTo({ center: [points[0].lng, points[0].lat], zoom: Math.min(zoom + 1, 15) })
    } else {
      map.flyTo({ center: [center[1], center[0]], zoom })
    }
  }, [points, selectedId, center, zoom])

  if (failed) {
    const [lat, lng] = center
    return (
      <p className="notice" role="status">
        Harita bu cihazda açılamadı.{' '}
        <a
          className="section-link"
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap&apos;te aç
        </a>
      </p>
    )
  }

  return (
    <div
      ref={host}
      role="region"
      aria-label={title}
      style={{ width: '100%', height: `min(${height}px, 62vh)` }}
    />
  )
}

function popupContent(p: MapPoint): HTMLElement {
  const box = document.createElement('div')
  box.style.cssText = 'font:14px Overpass,sans-serif;color:#121212;max-width:200px'
  const strong = document.createElement('strong')
  strong.textContent = p.label
  box.appendChild(strong)
  if (p.detail) {
    const small = document.createElement('div')
    small.style.cssText = 'color:#55575C;font-size:12px;margin-top:2px'
    small.textContent = p.detail
    box.appendChild(small)
  }
  return box
}

