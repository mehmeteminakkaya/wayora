import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createTrip, type Currency } from '../api/trips'
import { Alert, Button, Card, Field } from '../components/ui'

type Errors = Partial<Record<'destination' | 'title' | 'startDate' | 'endDate' | 'budget', string>>

function validate(destination: string, startDate: string, endDate: string, budget: string): Errors {
  const errors: Errors = {}
  if (destination.trim().length < 2) errors.destination = 'Destinasyon en az 2 karakter olmalı'
  if (!startDate) errors.startDate = 'Başlangıç tarihi zorunlu'
  if (!endDate) errors.endDate = 'Bitiş tarihi zorunlu'
  else if (startDate && endDate < startDate) errors.endDate = 'Bitiş tarihi başlangıçtan önce olamaz'
  if (budget && !(Number.isInteger(Number(budget)) && Number(budget) > 0)) {
    errors.budget = 'Bütçe sıfırdan büyük bir tam sayı olmalı'
  }
  return errors
}

export function NewTripPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Errors>({})
  const mutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (trip) => {
      queryClient.setQueryData(['trip', trip.id], trip)
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      navigate(`/geziler/${trip.id}`)
    },
    onError: (err) => {
      if (err instanceof ApiError) setErrors(err.fields)
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key: string) => String(form.get(key) ?? '')
    const found = validate(value('destination'), value('startDate'), value('endDate'), value('budget'))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    mutation.mutate({
      destination: value('destination'),
      title: value('title') || undefined,
      startDate: value('startDate'),
      endDate: value('endDate'),
      budget: value('budget') ? Number(value('budget')) : null,
      currency: value('currency') as Currency,
    })
  }

  const serverError = mutation.error && Object.keys(errors).length === 0 ? mutation.error.message : null

  return (
    <Card>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <h1>Yeni gezi</h1>
        {serverError && <Alert kind="error">{serverError}</Alert>}
        <Field label="Nereye gidiyorsun?" name="destination" placeholder="Örn. Roma" required error={errors.destination} />
        <Field label="Gezi adı (isteğe bağlı)" name="title" hint="Boş bırakırsan destinasyon kullanılır" error={errors.title} />
        <div className="row">
          <Field label="Başlangıç" name="startDate" type="date" required error={errors.startDate} />
          <Field label="Bitiş" name="endDate" type="date" required error={errors.endDate} />
        </div>
        <div className="row">
          <Field label="Bütçe (isteğe bağlı)" name="budget" type="number" min={1} step={1} inputMode="numeric" error={errors.budget} />
          <div className="field">
            <label className="label" htmlFor="currency">
              Para birimi
            </label>
            <select id="currency" name="currency" className="input" defaultValue="TRY">
              <option value="TRY">TL</option>
              <option value="EUR">Euro</option>
              <option value="USD">Dolar</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Oluşturuluyor…' : 'Geziyi oluştur'}
        </Button>
      </form>
    </Card>
  )
}
