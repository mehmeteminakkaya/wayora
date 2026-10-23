import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { addActivity, deleteActivity, type Activity, type ActivityCategory, type Trip, type TripDay } from '../api/trips'
import { formatMoney, formatWeekday } from '../format'
import { Alert, Button, Card, Field } from './ui'

// Değerler api/src/routes/activities.ts ile aynı olmalı
export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  SIGHTSEEING: 'Gezi',
  MUSEUM: 'Müze',
  FOOD: 'Yemek',
  NATURE: 'Doğa',
  SHOPPING: 'Alışveriş',
  NIGHTLIFE: 'Gece hayatı',
  TRANSPORT: 'Ulaşım',
  OTHER: 'Diğer',
}

type Errors = Partial<Record<'title' | 'startTime' | 'endTime' | 'estimatedCost' | 'notes', string>>

function timeRange({ startTime, endTime }: Activity) {
  if (startTime && endTime) return `${startTime}–${endTime}`
  return startTime ?? (endTime ? `–${endTime}` : null)
}

function ActivityForm({ trip, day, onDone }: { trip: Trip; day: TripDay; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [errors, setErrors] = useState<Errors>({})
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof addActivity>[2]) => addActivity(trip.id, day.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] })
      onDone()
    },
    onError: (err) => {
      if (err instanceof ApiError) setErrors(err.fields)
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key: string) => String(form.get(key) ?? '').trim()
    const found: Errors = {}
    if (value('title').length < 2) found.title = 'Aktivite adı en az 2 karakter olmalı'
    if (value('startTime') && value('endTime') && value('endTime') <= value('startTime')) {
      found.endTime = 'Bitiş saati başlangıçtan sonra olmalı'
    }
    const cost = value('estimatedCost')
    if (cost && !(Number.isInteger(Number(cost)) && Number(cost) >= 0)) {
      found.estimatedCost = 'Tahmini maliyet sıfır ya da pozitif bir tam sayı olmalı'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    mutation.mutate({
      title: value('title'),
      category: value('category') as ActivityCategory,
      startTime: value('startTime') || null,
      endTime: value('endTime') || null,
      estimatedCost: cost ? Number(cost) : null,
      notes: value('notes') || null,
    })
  }

  const serverError = mutation.error && Object.keys(errors).length === 0 ? mutation.error.message : null

  return (
    <form className="stack activity-form" onSubmit={onSubmit} noValidate aria-label={`${day.dayIndex}. güne aktivite ekle`}>
      {serverError && <Alert kind="error">{serverError}</Alert>}
      <Field label="Aktivite" name="title" placeholder="Örn. Kolezyum ziyareti" required error={errors.title} />
      <div className="row">
        <div className="field">
          <label className="label" htmlFor={`category-${day.id}`}>
            Kategori
          </label>
          <select id={`category-${day.id}`} name="category" className="input" defaultValue="SIGHTSEEING">
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Field label="Başlangıç saati" name="startTime" type="time" error={errors.startTime} />
        <Field label="Bitiş saati" name="endTime" type="time" error={errors.endTime} />
        <Field
          label={`Tahmini maliyet (${trip.currency})`}
          name="estimatedCost"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          error={errors.estimatedCost}
        />
      </div>
      <Field label="Not (isteğe bağlı)" name="notes" error={errors.notes} />
      <div className="row">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Ekleniyor…' : 'Ekle'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Vazgeç
        </Button>
      </div>
    </form>
  )
}

function ActivityItem({ trip, activity }: { trip: Trip; activity: Activity }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => deleteActivity(trip.id, activity.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', trip.id] }),
  })
  const time = timeRange(activity)
  return (
    <li className="activity">
      <div>
        <strong>{activity.title}</strong>
        <div className="muted">
          {[time, CATEGORY_LABELS[activity.category], activity.estimatedCost !== null && formatMoney(activity.estimatedCost, trip.currency)]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {activity.notes && <div className="hint">{activity.notes}</div>}
        {remove.isError && <span className="field-error">Silinemedi, tekrar dene</span>}
      </div>
      <Button variant="secondary" onClick={() => remove.mutate()} disabled={remove.isPending} aria-label={`${activity.title} aktivitesini sil`}>
        Sil
      </Button>
    </li>
  )
}

export function DayCard({ trip, day }: { trip: Trip; day: TripDay }) {
  const [adding, setAdding] = useState(false)
  return (
    <Card>
      <div className="stack">
        <h2 className="day-title">
          {day.dayIndex}. gün <span className="muted">· {formatWeekday(day.date)}</span>
        </h2>
        {day.activities.length === 0 && !adding && <p className="muted">Bu gün için henüz aktivite yok.</p>}
        {day.activities.length > 0 && (
          <ul className="activities">
            {day.activities.map((a) => (
              <ActivityItem key={a.id} trip={trip} activity={a} />
            ))}
          </ul>
        )}
        {adding ? (
          <ActivityForm trip={trip} day={day} onDone={() => setAdding(false)} />
        ) : (
          <div>
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Aktivite ekle
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
