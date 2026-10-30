import { Compass, Map, Plus, UserRound, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { WayoraLogo } from './WayoraLogo'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'topbar-link is-active' : 'topbar-link'

const mobileClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')

export function Layout() {
  const { user } = useAuth()
  const location = useLocation()
  const navigationType = useNavigationType()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isLanding = location.pathname === '/'
  const isExplore = location.pathname === '/kesfet'
  const isTrips = location.pathname === '/trips'
  const isProfile = location.pathname === '/profil'
  const isSocial = location.pathname === '/yol-arkadaslari'
  const showBottomNav = !!user && !isAuthPage && (isExplore || isTrips || isProfile || isSocial)

  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    // Yalnızca sayfa (pathname) değiştiğinde yukarı dön. Arama parametresi
    // değişimleri (ör. şehir sayfasında "seç" tiki) REPLACE navigasyonu
    // üretip navigationType'ı değiştiriyordu; bu da her tikte sayfayı
    // başına sıçratıyordu.
    const pathChanged = previousPathRef.current !== location.pathname
    previousPathRef.current = location.pathname
    if (!pathChanged || navigationType === 'POP' || navigator.userAgent.includes('jsdom')) {
      return
    }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    } catch {
      // Scroll API'si bulunmayan ortamlarda sessizce devam et.
    }
  }, [location.pathname, navigationType])

  return (
    <div className={`app-shell${showBottomNav ? ' has-bottom-nav' : ''}`}>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo" aria-label="Wayora ana sayfa">
            <WayoraLogo />
          </Link>

          {!isAuthPage && (
            <nav className="topbar-nav" aria-label="Ana menü">
              <NavLink to="/kesfet" className={navClass}>
                Keşfet
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/trips" className={navClass}>
                    Rotalarım
                  </NavLink>
                  <NavLink to="/yol-arkadaslari" className={navClass}>
                    Yol Arkadaşları
                  </NavLink>
                  <NavLink to="/trips/new" className={navClass}>
                    Planla
                  </NavLink>
                  <NavLink to="/profil" className={navClass}>
                    Profil
                  </NavLink>
                </>
              ) : (
                <NavLink to="/login" className={navClass}>
                  Giriş yap
                </NavLink>
              )}
            </nav>
          )}

          {!isAuthPage && (
            <div className="topbar-actions">
              {user ? (
                <Link className="icon-btn" to="/profil" aria-label="Profil">
                  <UserRound size={22} strokeWidth={1.75} />
                </Link>
              ) : (
                <Link className="topbar-login" to="/login">
                  Giriş yap
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="site-main" id="main">
        <Outlet />
      </main>

      {isLanding && (
        <footer className="landing-footer">
          <strong>WAYORA</strong>
          <div className="landing-footer-links">
            <span>Hakkında</span>
            <span>Gizlilik</span>
            <a href="/photo-credits.html" target="_blank" rel="noreferrer">
              Fotoğraf kaynakları
            </a>
            <span>İletişim</span>
          </div>
        </footer>
      )}

      {showBottomNav && (
        <nav className="bottom-nav" aria-label="Mobil menü">
          <NavLink to="/kesfet" className={mobileClass} end>
            <Compass size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>Keşfet</span>
          </NavLink>
          <NavLink to="/trips" className={mobileClass} end>
            <Map size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>Rotalarım</span>
          </NavLink>
          <NavLink to="/yol-arkadaslari" className={mobileClass} end>
            <Users size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>Yol</span>
          </NavLink>
          <NavLink to="/trips/new" className={mobileClass}>
            <Plus size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>Planla</span>
          </NavLink>
          <NavLink to="/profil" className={mobileClass}>
            <UserRound size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>Profil</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
