import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link is-active' : 'nav-link'

const mobileClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>

      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Wayora ana sayfa">
            WAYORA<span className="brand-slash">/</span>
            <span className="brand-sub">ROTASYON</span>
          </Link>

          <nav className={`main-nav${user ? ' is-auth' : ''}`} aria-label="Ana menü">
            {user ? (
              <>
                <NavLink to="/trips" className={navClass}>
                  Rotalar
                </NavLink>
                <NavLink to="/onboarding" className={navClass}>
                  Tercihler
                </NavLink>
                <span className="nav-user" title={user.email}>
                  {user.name ?? user.email}
                </span>
                <Link className="button small" to="/trips/new">
                  Rotanı çiz
                </Link>
                <button type="button" className="button ghost small" onClick={handleLogout}>
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Giriş
                </NavLink>
                <Link className="button small" to="/register">
                  Hesap aç
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="site-main" id="main">
        <Outlet />
      </main>

      {user ? (
        <nav className="mobile-nav" aria-label="Mobil menü">
          <NavLink to="/trips" className={mobileClass}>
            Rotasyon
          </NavLink>
          <NavLink to="/trips/new" className={mobileClass}>
            Planlama
          </NavLink>
          <NavLink to="/onboarding" className={mobileClass}>
            Kurulum
          </NavLink>
        </nav>
      ) : (
        <nav className="mobile-nav" aria-label="Mobil menü">
          <NavLink to="/" className={mobileClass} end>
            Rotasyon
          </NavLink>
          <NavLink to="/login" className={mobileClass}>
            Keşif
          </NavLink>
          <NavLink to="/register" className={mobileClass}>
            Kurulum
          </NavLink>
        </nav>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <span>WAYORA / ROTASYON</span>
          <span>JOB-191 · GREPTHINK · İSTİNYE ÜNİVERSİTESİ</span>
        </div>
      </footer>
    </div>
  )
}
