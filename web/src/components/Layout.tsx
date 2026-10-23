import { Link, Outlet } from 'react-router'

export function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Wayora
        </Link>
        <nav className="nav" aria-label="Ana menü">
          <Link to="/kayit" className="btn btn-primary">
            Kayıt ol
          </Link>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">Wayora · JOB-191</footer>
    </div>
  )
}
