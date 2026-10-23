import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const me = { 'GET /api/auth/me': [200, { user: { id: 'u1', email: 'a@b.co', name: null } }] } as const
const colosseum = {
  id: 'a1',
  order: 1,
  title: 'Kolezyum',
  category: 'SIGHTSEEING',
  startTime: '09:00',
  endTime: '11:30',
  estimatedCost: 18,
  notes: 'Biletleri önceden al',
}
const trip = {
  id: 't1',
  title: 'Roma',
  destination: 'Roma',
  startDate: '2026-11-02',
  endDate: '2026-11-03',
  budget: null,
  currency: 'EUR',
  status: 'DRAFT',
  days: [
    { id: 'd1', dayIndex: 1, date: '2026-11-02', notes: null, activities: [colosseum] },
    { id: 'd2', dayIndex: 2, date: '2026-11-03', notes: null, activities: [] },
  ],
}

const dayCard = (n: number) => screen.getByRole('heading', { name: new RegExp(`^${n}\\. gün`) }).closest('section')!

describe('Gezi detayı ve aktiviteler (W-15)', () => {
  it('günleri ve aktiviteleri saat, kategori ve maliyetle gösterir', async () => {
    mockApi({ ...me, 'GET /api/trips/t1': [200, { trip }] })
    renderAt('/geziler/t1')
    await screen.findByRole('heading', { name: 'Roma', level: 1 })
    expect(within(dayCard(1)).getByText('Kolezyum')).toBeInTheDocument()
    expect(within(dayCard(1)).getByText('09:00–11:30 · Gezi · €18')).toBeInTheDocument()
    expect(within(dayCard(1)).getByText('Biletleri önceden al')).toBeInTheDocument()
    expect(within(dayCard(2)).getByText('Bu gün için henüz aktivite yok.')).toBeInTheDocument()
  })

  it('güne aktivite ekler ve formu kapatır', async () => {
    const fetchMock = mockApi({
      ...me,
      'GET /api/trips/t1': [200, { trip }],
      'POST /api/trips/t1/days/d2/activities': [201, { activity: { ...colosseum, id: 'a2' } }],
    })
    renderAt('/geziler/t1')
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Roma', level: 1 })
    await user.click(within(dayCard(2)).getByRole('button', { name: 'Aktivite ekle' }))

    const form = screen.getByRole('form', { name: '2. güne aktivite ekle' })
    await user.type(within(form).getByLabelText('Aktivite'), 'Vatikan Müzeleri')
    await user.selectOptions(within(form).getByLabelText('Kategori'), 'MUSEUM')
    fireEvent.change(within(form).getByLabelText('Başlangıç saati'), { target: { value: '10:00' } })
    await user.type(within(form).getByLabelText('Tahmini maliyet (EUR)'), '25')
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))

    expect(await within(dayCard(2)).findByRole('button', { name: 'Aktivite ekle' })).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      title: 'Vatikan Müzeleri',
      category: 'MUSEUM',
      startTime: '10:00',
      endTime: null,
      estimatedCost: 25,
      notes: null,
    })
  })

  it('ters saat aralığında istek atmadan hata gösterir', async () => {
    const fetchMock = mockApi({ ...me, 'GET /api/trips/t1': [200, { trip }] })
    renderAt('/geziler/t1')
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Roma', level: 1 })
    await user.click(within(dayCard(2)).getByRole('button', { name: 'Aktivite ekle' }))
    const form = screen.getByRole('form', { name: '2. güne aktivite ekle' })
    await user.type(within(form).getByLabelText('Aktivite'), 'Akşam yemeği')
    fireEvent.change(within(form).getByLabelText('Başlangıç saati'), { target: { value: '20:00' } })
    fireEvent.change(within(form).getByLabelText('Bitiş saati'), { target: { value: '19:00' } })
    await user.click(within(form).getByRole('button', { name: 'Ekle' }))

    expect(within(form).getByLabelText('Bitiş saati')).toHaveAccessibleDescription('Bitiş saati başlangıçtan sonra olmalı')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('aktiviteyi siler', async () => {
    const fetchMock = mockApi({
      ...me,
      'GET /api/trips/t1': [200, { trip }],
      'DELETE /api/trips/t1/activities/a1': [204],
    })
    renderAt('/geziler/t1')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Kolezyum aktivitesini sil' }))
    await vi.waitFor(() =>
      expect(fetchMock.mock.calls.some(([url, init]) => url === '/api/trips/t1/activities/a1' && init?.method === 'DELETE')).toBe(true),
    )
  })
})
