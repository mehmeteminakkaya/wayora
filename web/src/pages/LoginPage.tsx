import { LogIn } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
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
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı')
    } finally {
      setBusy(false)
    }
  }

  function handleForgotPassword(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setError(null)
    setNotice('Şifre sıfırlama henüz yapılandırılmadı.')
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Giriş yap.</h1>
        <p className="auth-sub">Rotaların, tercihlerin ve planların hesabında durur.</p>

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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Şifren"
            />
          </label>

          <div className="auth-links" style={{ justifyContent: 'flex-end', marginTop: 0 }}>
            <a
              href="#"
              title="Şifre sıfırlama henüz yapılandırılmadı"
              style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
              onClick={handleForgotPassword}
            >
              Şifremi unuttum
            </a>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
            aria-busy={busy}
          >
            <LogIn size={20} strokeWidth={1.75} aria-hidden="true" />
            {busy ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </button>
        </form>

        <div className="auth-divider">veya</div>

        <button
          className="btn btn-secondary btn-block google-btn"
          type="button"
          onClick={() => {
            setError(null)
            setNotice('Google girişi henüz yapılandırılmadı.')
          }}
        >
          Google ile devam et
        </button>

        <div className="auth-links">
          <span>Hesabın yok mu?</span>
          <Link
            to="/register"
            style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
          >
            Hesap aç
          </Link>
        </div>
      </section>
    </div>
  )
}
