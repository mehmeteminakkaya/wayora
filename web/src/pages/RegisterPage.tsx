import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
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
      setError('Şifre en az 8 karakter olmalı.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({ email, password, name: name.trim() || undefined })
      navigate('/onboarding', { replace: true, state: { from } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap oluşturulamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">Hesap aç.</h1>
        <p className="auth-sub">
          Tercihlerini bir kez seç. Wayora her yeni planda bunları hatırlar.
        </p>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Adın (opsiyonel)</span>
            <input
              className="input"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Adın"
            />
          </label>

          <label className="field">
            <span>E-posta</span>
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
            <span>Şifre</span>
            <input
              className="input"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="En az 8 karakter"
              aria-describedby="password-hint"
            />
            <span className="helper" id="password-hint">
              En az 8 karakter. Boşluk ve Türkçe karakter kullanabilirsin.
            </span>
          </label>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            <UserPlus size={20} strokeWidth={1.75} aria-hidden="true" />
            {busy ? 'Hesap açılıyor...' : 'Hesap aç'}
          </button>
        </form>

        <div className="auth-links">
          <span>Hesabın var mı?</span>
          <Link
            to="/login"
            style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
          >
            Giriş yap
          </Link>
        </div>
      </section>
    </div>
  )
}
