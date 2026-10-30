import { Compass, Map, Plus, UserRound, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n.tsx'
import { AgentChat } from './AgentChat'
import { WayoraLogo } from './WayoraLogo'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'topbar-link is-active' : 'topbar-link'

const mobileClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')

export function Layout() {
  const { user } = useAuth()
  const { lang, setLang, t } = useLang()
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
        {t('nav.skip')}
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo" aria-label={t('nav.home')}>
            <WayoraLogo />
          </Link>

          {!isAuthPage && (
            <nav className="topbar-nav" aria-label="Main menu">
              <NavLink to="/kesfet" className={navClass}>
                {t('nav.explore')}
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/trips" className={navClass}>
                    {t('nav.trips')}
                  </NavLink>
                  <NavLink to="/yol-arkadaslari" className={navClass}>
                    {t('nav.social')}
                  </NavLink>
                  <NavLink to="/trips/new" className={navClass}>
                    {t('nav.plan')}
                  </NavLink>
                  <NavLink to="/profil" className={navClass}>
                    {t('nav.profile')}
                  </NavLink>
                </>
              ) : (
                <NavLink to="/login" className={navClass}>
                  {t('nav.login')}
                </NavLink>
              )}
            </nav>
          )}

          <div className="topbar-actions">
            <div className="lang-switch" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === 'tr' ? 'is-active' : ''}
                aria-pressed={lang === 'tr'}
                onClick={() => setLang('tr')}
              >
                TR
              </button>
              <button
                type="button"
                className={lang === 'en' ? 'is-active' : ''}
                aria-pressed={lang === 'en'}
                // Çeviri yalnızca menü + giriş/kayıt ekranlarında tamam; geri kalan
                // sayfalar hâlâ Türkçe. Yarım bir İngilizce görünüm vermemek için
                // kapsam tamamlanana kadar devre dışı.
                disabled
                title="İngilizce çok yakında"
                aria-disabled="true"
              >
                EN
              </button>
            </div>

            {!isAuthPage &&
              (user ? (
                <Link className="icon-btn" to="/profil" aria-label={t('nav.profile')}>
                  <UserRound size={22} strokeWidth={1.75} />
                </Link>
              ) : (
                <Link className="topbar-login" to="/login">
                  {t('nav.login')}
                </Link>
              ))}
          </div>
        </div>
      </header>

      <main className="site-main" id="main">
        <Outlet />
      </main>

      {isLanding && (
        <footer className="landing-footer">
          <strong>WAYORA</strong>
          <div className="landing-footer-links">
            <span>{t('landing.footerAbout')}</span>
            <span>{t('landing.footerPrivacy')}</span>
            <a href="/photo-credits.html" target="_blank" rel="noreferrer">
              {t('landing.footerPhotos')}
            </a>
            <span>{t('landing.footerContact')}</span>
          </div>
        </footer>
      )}

      {user && !isAuthPage && <AgentChat />}

      {showBottomNav && (
        <nav className="bottom-nav" aria-label="Mobile menu">
          <NavLink to="/kesfet" className={mobileClass} end>
            <Compass size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>{t('nav.explore')}</span>
          </NavLink>
          <NavLink to="/trips" className={mobileClass} end>
            <Map size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>{t('nav.trips')}</span>
          </NavLink>
          <NavLink to="/yol-arkadaslari" className={mobileClass} end>
            <Users size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>{t('nav.social')}</span>
          </NavLink>
          <NavLink to="/trips/new" className={mobileClass}>
            <Plus size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>{t('nav.plan')}</span>
          </NavLink>
          <NavLink to="/profil" className={mobileClass}>
            <UserRound size={24} strokeWidth={1.75} aria-hidden="true" />
            <span>{t('nav.profile')}</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
