import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Field } from '../components/ui'

type Errors = { email?: string; password?: string; name?: string }

// Sunucudaki kurallarla aynı; kullanıcı formu göndermeden önce hatayı görsün
function validate(email: string, password: string): Errors {
  const errors: Errors = {}
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Geçerli bir e-posta adresi girin'
  if (password.length < 8) errors.password = 'Şifre en az 8 karakter olmalı'
  return errors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Errors>({})

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['me'], user)
      navigate('/tercihler')
    },
    onError: (err) => {
      if (err instanceof ApiError) setErrors(err.fields)
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')
    const found = validate(email, password)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    mutation.mutate({ email, password, name: name || undefined })
  }

  const serverError =
    mutation.error && Object.keys(errors).length === 0 ? mutation.error.message : null

  return (
    <Card>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <h1>Hesap oluştur</h1>
        {serverError && <Alert kind="error">{serverError}</Alert>}
        <Field label="Ad (isteğe bağlı)" name="name" autoComplete="name" error={errors.name} />
        <Field
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
        />
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="En az 8 karakter"
          error={errors.password}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Kaydediliyor…' : 'Kayıt ol'}
        </Button>
      </form>
    </Card>
  )
}
