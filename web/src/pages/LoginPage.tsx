import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { login } from '../api/auth'
import { Alert, Button, Card, Field } from '../components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [missing, setMissing] = useState(false)
  // Korumalı bir sayfadan gelindiyse girişten sonra oraya dön
  const from = (location.state as { from?: string } | null)?.from ?? '/geziler'

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['me'], user)
      navigate(from, { replace: true })
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setMissing(!email || !password)
    if (email && password) mutation.mutate({ email, password })
  }

  return (
    <Card>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <h1>Giriş yap</h1>
        {missing && <Alert kind="error">E-posta ve şifreni gir</Alert>}
        {!missing && mutation.error && <Alert kind="error">{mutation.error.message}</Alert>}
        <Field label="E-posta" name="email" type="email" autoComplete="email" required />
        <Field label="Şifre" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
        <p className="muted">
          Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link>
        </p>
      </form>
    </Card>
  )
}
