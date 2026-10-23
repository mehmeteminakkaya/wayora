import { useEffect, useState } from 'react'
import { getHealth, type Health } from '../api'

type ApiState = { kind: 'loading' } | { kind: 'ok'; health: Health } | { kind: 'down' }

export function HomePage() {
  const [api, setApi] = useState<ApiState>({ kind: 'loading' })

  useEffect(() => {
    getHealth()
      .then((health) => setApi({ kind: 'ok', health }))
      .catch(() => setApi({ kind: 'down' }))
  }, [])

  return (
    <div className="stack">
      <h1 className="hero-title">Wayora</h1>
      <p className="tagline">Tercihlerine, bütçene ve süreye göre yapay zekâ destekli gezi planı.</p>
      <p className="mono muted" data-testid="api-status">
        {api.kind === 'loading' && 'API kontrol ediliyor…'}
        {api.kind === 'down' && 'API’ye ulaşılamıyor'}
        {api.kind === 'ok' &&
          `API çalışıyor · Veritabanı: ${api.health.db === 'ok' ? 'bağlı' : 'bağlı değil'}`}
      </p>
    </div>
  )
}
