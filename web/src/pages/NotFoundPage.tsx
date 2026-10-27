import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page-shell">
      <section className="empty-state">
        <span className="empty-code" aria-hidden="true">
          404
        </span>
        <h1>Sayfa bulunamadı.</h1>
        <p>Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link className="button" to="/">
          Ana sayfaya dön
        </Link>
      </section>
    </div>
  )
}
