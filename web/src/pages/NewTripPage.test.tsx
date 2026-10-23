import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const me = { 'GET /api/auth/me': [200, { user: { id: 'u1', email: 'a@b.co', name: null } }] } as const
const trip = {
  id: 't1',
  title: 'Roma',
  destination: 'Roma',
  startDate: '2026-11-02',
  endDate: '2026-11-03',
  budget: 15000,
  currency: 'TRY',
  status: 'DRAFT',
  days: [
    { id: 'd1', dayIndex: 1, date: '2026-11-02', notes: null, activities: [] },
    { id: 'd2', dayIndex: 2, date: '2026-11-03', notes: null, activities: [] },
  ],
}

// Tarih alanlarına userEvent ile yazmak tarayıcıya göre değişiyor; değeri doğrudan veriyoruz
function fill(destination: string, start: string, end: string, budget = '') {
  fireEvent.change(screen.getByLabelText('Nereye gidiyorsun?'), { target: { value: destination } })
  fireEvent.change(screen.getByLabelText('Başlangıç'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Bitiş'), { target: { value: end } })
  fireEvent.change(screen.getByLabelText('Bütçe (isteğe bağlı)'), { target: { value: budget } })
}

describe('Yeni gezi (W-13)', () => {
  it('bitiş başlangıçtan önceyse istek atmadan hata gösterir', async () => {
    const fetchMock = mockApi(me)
    renderAt('/geziler/yeni')
    await screen.findByRole('heading', { name: 'Yeni gezi' })
    fill('Roma', '2026-11-05', '2026-11-02')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Geziyi oluştur' }))
    expect(screen.getByLabelText('Bitiş')).toHaveAccessibleDescription('Bitiş tarihi başlangıçtan önce olamaz')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('geziyi oluşturup gün gün detay sayfasına götürür', async () => {
    const fetchMock = mockApi({ ...me, 'POST /api/trips': [201, { trip }], 'GET /api/trips/t1': [200, { trip }] })
    const { router } = renderAt('/geziler/yeni')
    await screen.findByRole('heading', { name: 'Yeni gezi' })
    fill('Roma', '2026-11-02', '2026-11-03', '15000')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Geziyi oluştur' }))

    expect(await screen.findByRole('heading', { name: 'Roma', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/geziler/t1')
    expect(screen.getByRole('heading', { name: /1\. gün · 2 Kasım Pazartesi/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /2\. gün/ })).toBeInTheDocument()
    expect(screen.getByText(/2 gün · Bütçe: ₺15\.000/)).toBeInTheDocument()

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      destination: 'Roma',
      startDate: '2026-11-02',
      endDate: '2026-11-03',
      budget: 15000,
      currency: 'TRY',
    })
  })
})

describe('Gezi sayfası (W-13)', () => {
  it('başkasının ya da olmayan gezisi için bulunamadı mesajı gösterir', async () => {
    mockApi({
      ...me,
      'GET /api/trips/baskasinin': [404, { error: { code: 'TRIP_NOT_FOUND', message: 'Gezi bulunamadı' } }],
    })
    renderAt('/geziler/baskasinin')
    expect(await screen.findByRole('alert')).toHaveTextContent('Bu gezi bulunamadı.')
  })
})
