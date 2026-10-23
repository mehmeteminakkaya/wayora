import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { getPreferences, savePreferences, type Preferences } from '../api/preferences'
import { Alert, Button, Card } from '../components/ui'

// Değerler api/src/routes/preferences.ts ile aynı olmalı
const INTERESTS: [string, string][] = [
  ['museum', 'Müze'],
  ['history', 'Tarih'],
  ['art', 'Sanat'],
  ['nature', 'Doğa'],
  ['food', 'Yemek'],
  ['shopping', 'Alışveriş'],
  ['nightlife', 'Gece hayatı'],
  ['beach', 'Plaj'],
  ['adventure', 'Macera'],
]
const BUDGETS: [Preferences['budgetLevel'], string][] = [
  ['LOW', 'Ekonomik'],
  ['MEDIUM', 'Orta'],
  ['HIGH', 'Lüks'],
]
const PACES: [Preferences['pace'], string][] = [
  ['RELAXED', 'Sakin'],
  ['BALANCED', 'Dengeli'],
  ['PACKED', 'Yoğun'],
]
const STYLES: [NonNullable<Preferences['travelStyle']>, string][] = [
  ['SOLO', 'Tek başına'],
  ['COUPLE', 'Çift'],
  ['FAMILY', 'Aile'],
  ['FRIENDS', 'Arkadaşlarla'],
]

type Errors = Partial<Record<'interests' | 'budgetLevel' | 'pace', string>>

function PreferencesForm({ initial }: { initial: Preferences | null }) {
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Errors>({})
  const mutation = useMutation({
    mutationFn: savePreferences,
    onSuccess: (saved) => queryClient.setQueryData(['preferences'], saved),
    onError: (err) => {
      if (err instanceof ApiError) setErrors(err.fields)
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const interests = form.getAll('interests').map(String)
    const budgetLevel = form.get('budgetLevel') as Preferences['budgetLevel'] | null
    const pace = form.get('pace') as Preferences['pace'] | null
    const travelStyle = (form.get('travelStyle') || null) as Preferences['travelStyle']
    const found: Errors = {}
    if (interests.length === 0) found.interests = 'En az bir ilgi alanı seç'
    if (!budgetLevel) found.budgetLevel = 'Bütçe seviyesi seç'
    if (!pace) found.pace = 'Tempo seç'
    setErrors(found)
    if (budgetLevel && pace && interests.length > 0) {
      mutation.mutate({ interests, budgetLevel, pace, travelStyle })
    }
  }

  const fieldError = (key: keyof Errors) =>
    errors[key] && (
      <span className="field-error" role="alert">
        {errors[key]}
      </span>
    )

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {mutation.isSuccess && <Alert kind="success">Tercihlerin kaydedildi</Alert>}
      {mutation.isError && !(mutation.error instanceof ApiError && mutation.error.status === 400) && (
        <Alert kind="error">{mutation.error.message}</Alert>
      )}

      <fieldset className="choices">
        <legend className="label">İlgi alanların</legend>
        {INTERESTS.map(([value, label]) => (
          <label key={value} className="choice">
            <input
              type="checkbox"
              name="interests"
              value={value}
              defaultChecked={initial?.interests.includes(value)}
            />
            {label}
          </label>
        ))}
        {fieldError('interests')}
      </fieldset>

      <fieldset className="choices">
        <legend className="label">Bütçe seviyen</legend>
        {BUDGETS.map(([value, label]) => (
          <label key={value} className="choice">
            <input type="radio" name="budgetLevel" value={value} defaultChecked={initial?.budgetLevel === value} />
            {label}
          </label>
        ))}
        {fieldError('budgetLevel')}
      </fieldset>

      <fieldset className="choices">
        <legend className="label">Gezi temposu</legend>
        {PACES.map(([value, label]) => (
          <label key={value} className="choice">
            <input type="radio" name="pace" value={value} defaultChecked={initial?.pace === value} />
            {label}
          </label>
        ))}
        {fieldError('pace')}
      </fieldset>

      <div className="field">
        <label className="label" htmlFor="travelStyle">
          Kiminle seyahat ediyorsun? (isteğe bağlı)
        </label>
        <select id="travelStyle" name="travelStyle" className="input" defaultValue={initial?.travelStyle ?? ''}>
          <option value="">Belirtme</option>
          {STYLES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </form>
  )
}

export function PreferencesPage() {
  const { data, isPending, error } = useQuery({ queryKey: ['preferences'], queryFn: getPreferences })
  return (
    <Card>
      <div className="stack">
        <h1>Tercihlerin</h1>
        <p className="muted">Gezi planların bu tercihlere göre hazırlanacak.</p>
        {isPending && <p className="muted">Yükleniyor…</p>}
        {error && <Alert kind="error">{error.message}</Alert>}
        {!isPending && !error && <PreferencesForm initial={data ?? null} />}
      </div>
    </Card>
  )
}
