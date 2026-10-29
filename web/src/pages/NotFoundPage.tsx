import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page narrow">
      <div className="empty-state">
        <p className="eyebrow">404 / SAYFA YOK</p>
        <h1>Aradığın sayfa burada değil.</h1>
        <p>Bağlantı taşınmış olabilir. Keşfet’e dönüp yeni bir rota çizebilirsin.</p>
        <Link className="btn btn-primary" to="/kesfet">
          Keşfet’e dön
        </Link>
      </div>
    </div>
  )
}
