import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { api } from '../api'
import type { BudgetLevel, Pace, Preference, TravelStyle } from '../api'
import { DetailSkeleton } from '../components/Skeletons'
import { useAuth } from '../auth/AuthContext'

const BUDGET_LABELS: Record<BudgetLevel, string> = {
  low: 'Ekonomik',
  mid: 'Dengeli',
  high: 'Konforlu',
}

const STYLE_LABELS: Record<TravelStyle, string> = {
  relaxed: 'Sakin',
  balanced: 'Dengeli',
  packed: 'Dolu dolu',
}

const PACE_LABELS: Record<Pace, string> = {
  slow: 'Yavaş',
  moderate: 'Orta',
  fast: 'Hızlı',
}

export function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [preference, setPreference] = useState<Preference | null>(null)
  const [preferenceError, setPreferenceError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    api
      .getPreferences()
      .then(({ preference: item }) => {
        if (active) {
          setPreference(item)
          setPreferenceError(null)
        }
      })
      .catch(() => {
        if (active) {
          setPreference(null)
          setPreferenceError('Tercihler yüklenemedi. Tercihleri düzenle ekranından yeniden kaydedebilirsin.')
        }
      })
    return () => {
      active = false
    }
  }, [user])

  if (loading) {
    return <DetailSkeleton />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/profil' }} />
  }

  const displayName = user.name?.trim() || user.email
  const hasName = Boolean(user.name?.trim())
  const initial = displayName.charAt(0).toLocaleUpperCase('tr-TR')

  async function handleLogout() {
    setBusy(true)
    setError(null)
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çıkış yapılamadı. Tekrar dene.')
      setBusy(false)
    }
  }

  return (
    <div className="page narrow">
      <header className="page-heading">
        <div>
          <p className="eyebrow">PROFİL</p>
          <h1>Hesabın</h1>
        </div>
      </header>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <section className="profile-card" aria-labelledby="profil-ad">
        <div className="profile-avatar" aria-hidden="true">
          {initial}
        </div>
        <h2 className="profile-name" id="profil-ad">
          {displayName}
        </h2>
        {hasName && <p className="profile-email">{user.email}</p>}

        <div className="profile-section">
          <h3>Tercihler</h3>
          {preference ? (
            <ul className="info-list">
              <li>
                <span>İlgi alanları</span>
                <strong>
                  {preference.interests.length > 0
                    ? preference.interests.join(' · ')
                    : 'Seçilmedi'}
                </strong>
              </li>
              <li>
                <span>Bütçe</span>
                <strong>{BUDGET_LABELS[preference.budgetLevel]}</strong>
              </li>
              <li>
                <span>Seyahat tarzı</span>
                <strong>{STYLE_LABELS[preference.travelStyle]}</strong>
              </li>
              <li>
                <span>Tempo</span>
                <strong>{PACE_LABELS[preference.pace]}</strong>
              </li>
            </ul>
          ) : preferenceError ? (
            <p className="small muted">{preferenceError}</p>
          ) : (
            <p className="small muted" role="status">
              Tercihler yükleniyor…
            </p>
          )}
        </div>

        <nav className="profile-actions" aria-label="Profil bağlantıları">
          <Link className="profile-row" to="/onboarding">
            <span>Tercihleri düzenle</span>
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <Link className="profile-row" to="/trips">
            <span>Rotalarım</span>
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <Link className="profile-row" to="/kesfet">
            <span>Keşfet</span>
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </nav>

        <div className="profile-actions">
          <button
            className="btn btn-secondary btn-block"
            type="button"
            onClick={handleLogout}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </button>
        </div>
      </section>

      <section className="profile-card profile-section" aria-labelledby="hesap-baslik">
        <h2 id="hesap-baslik">Hesap</h2>
        <ul className="info-list">
          <li>
            <span>E-posta</span>
            <strong style={{ overflowWrap: 'anywhere' }}>{user.email}</strong>
          </li>
          <li>
            <span>Oturum</span>
            <strong>Açık</strong>
          </li>
        </ul>
      </section>
    </div>
  )
}
