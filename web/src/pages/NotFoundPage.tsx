import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="stack">
      <h1>Sayfa bulunamadı</h1>
      <p className="muted">Aradığın sayfa yok ya da taşınmış olabilir.</p>
      <p>
        <Link to="/">Ana sayfaya dön</Link>
      </p>
    </div>
  )
}
