import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({ email, password, name: name.trim() || undefined })
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap oluşturulamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-poster">
        <div>
          <p className="eyebrow">WAYORA / KAYIT</p>
          <h1>
            Yeni
            <br />
            rota.
          </h1>
          <p>
            Tercihlerini bir kez seç. Wayora her yeni planda bunları hatırlar; sen sadece şehri ve
            tarihleri değiştirirsin.
          </p>
        </div>
        <div className="auth-poster-foot">
          <span>İLGİ ALANLARI</span>
          <span>BÜTÇE / TEMPO</span>
        </div>
      </aside>

      <section className="auth-form">
        <p className="eyebrow">HESAP / 01</p>
        <h2>Hesap aç.</h2>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Adın (opsiyonel)</span>
            <input
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="En az 8 karakter"
              aria-describedby="password-hint"
            />
            <span className="field-hint" id="password-hint">
              En az 8 karakter. Boşluk ve Türkçe karakter kullanabilirsin.
            </span>
          </label>

          <button className="button full" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Hesap açılıyor…' : 'Hesap aç'}
          </button>
        </form>

        <p className="auth-switch">
          Hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </section>
    </div>
  )
}
