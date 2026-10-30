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

type StyleKey = 'map' | 'satellite' | 'dark'

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles © Esri — Maxar, Earthstar Geographics',
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'imagery', type: 'raster', source: 'imagery' },
    { id: 'labels', type: 'raster', source: 'labels' },
  ],
}

const STYLES: Record<StyleKey, string | maplibregl.StyleSpecification> = {
  map: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: SATELLITE_STYLE,
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

const STYLE_LABELS: Array<[StyleKey, string]> = [
  ['map', 'Harita'],
  ['satellite', 'Uydu'],
  ['dark', 'Koyu'],
]

function markerEl(index: number, active: boolean): HTMLButtonElement {
  // MapLibre dış öğenin transform'unu kendisi yönettiği için şekil iç öğede döner.
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

// Wayora renkleri: krem zemin, sade yollar, yumuşak su/park, sakin etiketler.
function applyBrandStyle(map: maplibregl.Map, tilted: boolean) {
  const style = map.getStyle()
  if (!style?.layers) return
  const set = (id: string, prop: string, value: unknown) => {
    try {
      map.setPaintProperty(id, prop as 'background-color', value as string)
    } catch {
      /* katman bu özelliği desteklemiyor */
    }
  }
  for (const layer of style.layers) {
    const id = layer.id
    if (layer.type === 'background') set(id, 'background-color', '#F3F3F1')
    else if (layer.type === 'fill') {
      if (id === 'water' || id === 'water_shadow') set(id, 'fill-color', '#C9DCE6')
      else if (id.startsWith('park') || id === 'landcover') set(id, 'fill-color', '#DCE8D3')
      else if (id.startsWith('landuse')) set(id, 'fill-color', '#EDECE8')
      else if (id === 'building' || id === 'building-top') {
        set(id, 'fill-color', '#E4E3DD')
        set(id, 'fill-outline-color', '#D6D5CE')
      }
    } else if (layer.type === 'line') {
      if (id.endsWith('_fill') || id.includes('_fill_')) set(id, 'line-color', '#FFFFFF')
      else if (id.includes('_case')) set(id, 'line-color', '#E0DFD9')
      else if (id.startsWith('boundary')) set(id, 'line-color', '#D2D1CB')
    } else if (layer.type === 'symbol') {
      set(id, 'text-color', id.startsWith('watername') ? '#6F8FA3' : '#3E4046')
      set(id, 'text-halo-color', '#F3F3F1')
      set(id, 'text-halo-width', 1.6)
    }
  }
  // 3B: bina yükseklikleri. Yalnızca eğik modda görünür.
  const building = style.layers.find((l) => l.id === 'building')
  if (building && 'source' in building && typeof building.source === 'string' && !map.getLayer('building-3d')) {
    map.addLayer({
      id: 'building-3d',
      type: 'fill-extrusion',
      source: building.source,
      'source-layer': 'building',
      minzoom: 13,
      layout: { visibility: tilted ? 'visible' : 'none' },
      paint: {
        'fill-extrusion-color': '#E9E8E2',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.92,
      },
    })
  }
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
  const [styleKey, setStyleKey] = useState<StyleKey>('map')
  const [tilted, setTilted] = useState(false)
  const appliedStyle = useRef<StyleKey>('map')
  const tiltedRef = useRef(false)
  const styleKeyRef = useRef<StyleKey>('map')
  const refit = useRef<() => void>(() => {})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!host.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: host.current,
        style: STYLES.map,
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
    map.on('style.load', () => {
      if (styleKeyRef.current === 'map') applyBrandStyle(map, tiltedRef.current)
    })
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
    styleKeyRef.current = styleKey
    mapRef.current?.setStyle(STYLES[styleKey])
  }, [styleKey])

  useEffect(() => {
    tiltedRef.current = tilted
    const map = mapRef.current
    if (!map) return
    if (map.getLayer('building-3d')) map.setLayoutProperty('building-3d', 'visibility', tilted ? 'visible' : 'none')
    map.easeTo({ pitch: tilted ? 60 : 0, bearing: tilted ? -20 : 0, duration: 800 })
  }, [tilted])

  // Üst bileşen her render'da yeni dizi verir; haritayı yalnızca içerik değişince güncelle.
  const pointsKey = JSON.stringify(points.map((p) => [p.id, p.lat, p.lng]))

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current = []
    map.resize()
    const bounds = new maplibregl.LngLatBounds()
    points.forEach((p, i) => {
      const el = markerEl(i + 1, p.id === selectedId)
      el.setAttribute('aria-label', p.label)
      el.addEventListener('click', () => onSelectRef.current?.(p.id))
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20, closeButton: false }).setDOMContent(
            popupContent(p),
          ),
        )
        .addTo(map)
      markers.current.push(marker)
    })
    // Uzaktaki tek bir nokta (ör. ada) görünümü açmasın: medyana yakın noktalara sığdır.
    const med = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
    const midLat = med(points.map((p) => p.lat))
    const midLng = med(points.map((p) => p.lng))
    points.forEach((p) => {
      if (Math.abs(p.lat - midLat) < 0.1 && Math.abs(p.lng - midLng) < 0.12) bounds.extend([p.lng, p.lat])
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

