import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n.tsx'

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/trips'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({ email, password, name: name.trim() || undefined })
      navigate('/onboarding', { replace: true, state: { from } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">{t('auth.registerTitle')}</h1>
        <p className="auth-sub">{t('auth.registerSub')}</p>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t('auth.name')}</span>
            <input
              className="input"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('auth.namePlaceholder')}
            />
          </label>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              aria-describedby="password-hint"
            />
            <span className="helper" id="password-hint">
              {t('auth.passwordHint')}
            </span>
          </label>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            <UserPlus size={20} strokeWidth={1.75} aria-hidden="true" />
            {busy ? `${t('auth.registerBtn')}...` : t('auth.registerBtn')}
          </button>
        </form>

        <div className="auth-links">
          <span>{t('auth.haveAccount')}</span>
          <Link
            to="/login"
            style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
          >
            {t('auth.loginBtn')}
          </Link>
        </div>
      </section>
    </div>
  )
}
