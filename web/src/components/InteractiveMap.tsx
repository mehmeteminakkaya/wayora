import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox genel (pk.) token'ı VITE_MAPBOX_TOKEN ile verilir (Vercel ortam değişkeni).
// Repoda tutulmaz; Mapbox panelinden URL kısıtı koyun.
const TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined)?.trim() ?? ''
mapboxgl.accessToken = TOKEN

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

type StyleKey = 'map' | 'satellite' | 'dark'

const STYLES: Record<StyleKey, string> = {
  // Standard: Mapbox'ın 3B bina ve yer işaretli modern stili.
  map: 'mapbox://styles/mapbox/standard',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
}

const STYLE_LABELS: Array<[StyleKey, string]> = [
  ['map', 'Harita'],
  ['satellite', 'Uydu'],
  ['dark', 'Koyu'],
]

function markerEl(index: number, active: boolean): HTMLButtonElement {
  // Mapbox dış öğenin transform'unu kendisi yönettiği için şekil iç öğede döner.
  const el = document.createElement('button')
  el.type = 'button'
  el.style.cssText = 'width:34px;height:42px;padding:0;border:0;background:none;cursor:pointer'
  const pin = document.createElement('span')
  pin.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'width:30px',
    'height:30px',
    'margin:2px auto 0',
    'border-radius:50% 50% 50% 0',
    `background:${active ? '#121212' : '#FFC400'}`,
    'border:2.5px solid #fff',
    'box-shadow:0 4px 12px rgba(18,18,18,.3)',
    `transform:translateY(-4px) rotate(-45deg) scale(${active ? 1.2 : 1})`,
    'transition:transform .2s cubic-bezier(.34,1.56,.64,1)',
  ].join(';')
  const label = document.createElement('span')
  label.textContent = String(index)
  label.style.cssText = `transform:rotate(45deg);font:800 12px Overpass,sans-serif;color:${active ? '#FFC400' : '#121212'}`
  pin.appendChild(label)
  el.appendChild(pin)
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
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [failed, setFailed] = useState(false)
  const [styleKey, setStyleKey] = useState<StyleKey>('map')
  const [tilted, setTilted] = useState(false)
  const appliedStyle = useRef<StyleKey>('map')
  const refit = useRef<() => void>(() => {})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!host.current) return
    let map: mapboxgl.Map
    try {
      if (!TOKEN) throw new Error('VITE_MAPBOX_TOKEN yok')
      map = new mapboxgl.Map({
        container: host.current,
        style: STYLES.map,
        center: [center[1], center[0]],
        zoom,
        attributionControl: true,
        config: { basemap: { showPointOfInterestLabels: false, lightPreset: 'day' } },
      } as mapboxgl.MapOptions)
    } catch {
      // WebGL yoksa (eski cihaz, test ortamı) harita yerine bağlantı gösterilir.
      setFailed(true)
      return
    }
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false }), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    mapRef.current = map
    // Düzen sonradan değişirse (görsel yüklenmesi, mobil çubuk) boyutu ve görünümü yenile.
    const observer = new ResizeObserver(() => {
      map.resize()
      refit.current()
    })
    observer.observe(host.current)
    return () => {
      observer.disconnect()
      markers.current.forEach((m) => m.remove())
      markers.current = []
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Stil değişince işaretçiler DOM öğesi olduğu için korunur.
    if (appliedStyle.current === styleKey) return
    appliedStyle.current = styleKey
    mapRef.current?.setStyle(STYLES[styleKey])
  }, [styleKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({
      pitch: tilted ? 62 : 0,
      bearing: tilted ? -20 : 0,
      zoom: tilted ? Math.max(map.getZoom(), 15.5) : map.getZoom(),
      duration: 900,
    })
  }, [tilted])

  // Üst bileşen her render'da yeni dizi verir; haritayı yalnızca içerik değişince güncelle.
  const pointsKey = JSON.stringify(points.map((p) => [p.id, p.lat, p.lng]))

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current = []
    map.resize()
    const bounds = new mapboxgl.LngLatBounds()
    points.forEach((p, i) => {
      const el = markerEl(i + 1, p.id === selectedId)
      el.setAttribute('aria-label', p.label)
      el.addEventListener('click', () => onSelectRef.current?.(p.id))
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 36, closeButton: false }).setDOMContent(popupContent(p)),
        )
        .addTo(map)
      markers.current.push(marker)
    })
    // Uzaktaki tek bir nokta (ör. ada) görünümü açmasın: medyana yakın noktalara sığdır.
    const med = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
    const midLat = med(points.map((p) => p.lat))
    const midLng = med(points.map((p) => p.lng))
    points.forEach((p) => {
      if (Math.abs(p.lat - midLat) < 0.1 && Math.abs(p.lng - midLng) < 0.12) {
        bounds.extend([p.lng, p.lat])
      }
    })
    const selected = points.find((p) => p.id === selectedId)
    refit.current = () => {
      if (selected) return
      if (points.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 })
      else if (points.length === 1)
        map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: Math.min(zoom + 1, 15) })
      else map.jumpTo({ center: [center[1], center[0]], zoom })
    }
    if (selected) {
      map.flyTo({ center: [selected.lng, selected.lat], zoom: Math.max(map.getZoom(), 15), speed: 1.3 })
      const idx = points.indexOf(selected)
      markers.current[idx]?.togglePopup()
    } else if (points.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 })
    } else if (points.length === 1) {
      map.flyTo({ center: [points[0].lng, points[0].lat], zoom: Math.min(zoom + 1, 15) })
    } else {
      map.flyTo({ center: [center[1], center[0]], zoom })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, selectedId, center[0], center[1], zoom])

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
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={host}
        role="region"
        aria-label={title}
        style={{ width: '100%', height: `min(${height}px, 62vh)` }}
      />
      <div
        role="group"
        aria-label="Harita stili"
        style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4, zIndex: 2 }}
      >
        {STYLE_LABELS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={styleKey === key}
            onClick={() => setStyleKey(key)}
            style={mapButton(styleKey === key)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={tilted}
          onClick={() => setTilted((value) => !value)}
          style={mapButton(tilted)}
        >
          3B
        </button>
      </div>
    </div>
  )
}

function mapButton(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    border: '1px solid rgba(255,255,255,.6)',
    borderRadius: 999,
    background: active ? '#121212' : 'rgba(255,255,255,.72)',
    color: active ? '#fff' : '#121212',
    WebkitBackdropFilter: 'blur(14px) saturate(180%)',
    backdropFilter: 'blur(14px) saturate(180%)',
    boxShadow: '0 2px 10px rgba(18,18,18,.15)',
    font: '700 12px Overpass, sans-serif',
    cursor: 'pointer',
  }
}

function popupContent(p: MapPoint): HTMLElement {
  const box = document.createElement('div')
  box.style.cssText = 'font:14px Overpass,sans-serif;color:#121212;max-width:220px;padding:2px 2px'
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
