import { LogIn } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n.tsx'

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/trips'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  function handleForgotPassword(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setError(null)
    setNotice(t('auth.forgotNotice'))
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">{t('auth.loginTitle')}</h1>
        <p className="auth-sub">{t('auth.loginSub')}</p>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t('auth.email')}</span>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@eposta.com"
            />
          </label>

          <label className="field">
            <span>{t('auth.password')}</span>
            <input
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          <div className="auth-links" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
            <a
              href="#"
              title={t('auth.forgotNotice')}
              style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
              onClick={handleForgotPassword}
            >
              {t('auth.forgot')}
            </a>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            <LogIn size={20} strokeWidth={1.75} aria-hidden="true" />
            {busy ? `${t('auth.loginBtn')}...` : t('auth.loginBtn')}
          </button>
        </form>

        <div className="auth-divider">{t('auth.or')}</div>

        <button
          className="btn btn-secondary btn-block google-btn"
          type="button"
          onClick={() => {
            setError(null)
            setNotice(t('auth.googleNotice'))
          }}
        >
          {t('auth.google')}
        </button>

        <div className="auth-links">
          <span>{t('auth.noAccount')}</span>
          <Link
            to="/register"
            state={{ from }}
            style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
          >
            {t('auth.createAccount')}
          </Link>
        </div>
      </section>
    </div>
  )
}
