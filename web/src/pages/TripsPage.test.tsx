import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const me = { 'GET /api/auth/me': [200, { user: { id: 'u1', email: 'a@b.co', name: null } }] } as const
const summary = (id: string, title: string, startDate: string) => ({
  id,
  title,
  destination: title,
  startDate,
  endDate: startDate,
  budget: null,
  currency: 'TRY',
  status: 'DRAFT',
  dayCount: 1,
})

describe('Gezilerim (W-14)', () => {
  it('gezileri bağlantılarıyla listeler', async () => {
    mockApi({ ...me, 'GET /api/trips': [200, { trips: [summary('t1', 'Paris', '2026-11-10'), summary('t2', 'Roma', '2026-12-01')] }] })
    renderAt('/geziler')
    expect(await screen.findByRole('link', { name: 'Paris' })).toHaveAttribute('href', '/geziler/t1')
    expect(screen.getByRole('link', { name: 'Roma' })).toHaveAttribute('href', '/geziler/t2')
    expect(screen.getByText(/10 Kasım 2026 · 1 gün/)).toBeInTheDocument()
  })

  it('gezi yoksa boş durumu ve oluşturma bağlantısını gösterir', async () => {
    mockApi({ ...me, 'GET /api/trips': [200, { trips: [] }] })
    renderAt('/geziler')
    expect(await screen.findByText('Henüz bir gezin yok.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'İlk gezini oluştur' })).toHaveAttribute('href', '/geziler/yeni')
  })

  it('onaylanınca geziyi siler ve listeden kaldırır', async () => {
    const fetchMock = mockApi({
      ...me,
      'GET /api/trips': [200, { trips: [summary('t1', 'Paris', '2026-11-10'), summary('t2', 'Roma', '2026-12-01')] }],
      'DELETE /api/trips/t1': [204],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderAt('/geziler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Paris gezisini sil' }))

    expect(await screen.findByRole('link', { name: 'Roma' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Paris' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => url === '/api/trips/t1' && init?.method === 'DELETE')).toBe(true)
  })

  it('onay verilmezse silmez', async () => {
    const fetchMock = mockApi({ ...me, 'GET /api/trips': [200, { trips: [summary('t1', 'Paris', '2026-11-10')] }] })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderAt('/geziler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Paris gezisini sil' }))
    expect(screen.getByRole('link', { name: 'Paris' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })

  it('silme başarısız olursa geziyi listede tutar ve hatayı gösterir', async () => {
    mockApi({
      ...me,
      'GET /api/trips': [200, { trips: [summary('t1', 'Paris', '2026-11-10')] }],
      'DELETE /api/trips/t1': [500, { error: { code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu' } }],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderAt('/geziler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Paris gezisini sil' }))
    const card = (await screen.findByRole('alert')).closest('section')!
    expect(within(card).getByRole('alert')).toHaveTextContent('Gezi silinemedi: Beklenmeyen bir hata oluştu')
    expect(screen.getByRole('link', { name: 'Paris' })).toBeInTheDocument()
  })
})
