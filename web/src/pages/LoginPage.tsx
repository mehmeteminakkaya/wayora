import { useState } from 'react'
import type { FormEvent } from 'react'
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
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-poster">
        <div>
          <p className="eyebrow">WAYORA / GİRİŞ</p>
          <h1>
            Kaldığın
            <br />
            yerden.
          </h1>
          <p>
            Gezilerin, tercihlerin ve hazır planların hesabında durur. Yeni bir şehir için tekrar
            başlamak zorunda kalmazsın.
          </p>
        </div>
        <div className="auth-poster-foot">
          <span>IST → PAR</span>
          <span>03 GÜN / 500 €</span>
        </div>
      </aside>

      <section className="auth-form">
        <p className="eyebrow">OTURUM / 01</p>
        <h2>Giriş yap.</h2>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-posta</span>
            <input
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
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button className="button full" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>

        <p className="auth-switch">
          Hesabın yok mu? <Link to="/register">Hesap aç</Link>
        </p>
      </section>
    </div>
  )
}
