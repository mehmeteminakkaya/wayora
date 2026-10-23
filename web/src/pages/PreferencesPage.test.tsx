import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const me = { 'GET /api/auth/me': [200, { user: { id: 'u1', email: 'a@b.co', name: null } }] } as const

describe('Tercih ekranı (W-12)', () => {
  it('kayıtlı tercihleri işaretli gösterir', async () => {
    mockApi({
      ...me,
      'GET /api/me/preferences': [
        200,
        { preferences: { interests: ['food', 'art'], budgetLevel: 'HIGH', pace: 'RELAXED', travelStyle: 'COUPLE' } },
      ],
    })
    renderAt('/tercihler')
    expect(await screen.findByRole('checkbox', { name: 'Yemek' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Sanat' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Müze' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Lüks' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sakin' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: /Kiminle/ })).toHaveValue('COUPLE')
  })

  it('eksik seçimde istek atmadan Türkçe hata gösterir', async () => {
    const fetchMock = mockApi({ ...me, 'GET /api/me/preferences': [200, { preferences: null }] })
    renderAt('/tercihler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Kaydet' }))
    expect(screen.getByText('En az bir ilgi alanı seç')).toBeInTheDocument()
    expect(screen.getByText('Bütçe seviyesi seç')).toBeInTheDocument()
    expect(screen.getByText('Tempo seç')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  it('seçimleri kaydeder ve onay gösterir', async () => {
    const saved = { interests: ['museum', 'nature'], budgetLevel: 'LOW', pace: 'PACKED', travelStyle: null }
    const fetchMock = mockApi({
      ...me,
      'GET /api/me/preferences': [200, { preferences: null }],
      'PUT /api/me/preferences': [200, { preferences: saved }],
    })
    renderAt('/tercihler')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('checkbox', { name: 'Müze' }))
    await user.click(screen.getByRole('checkbox', { name: 'Doğa' }))
    await user.click(screen.getByRole('radio', { name: 'Ekonomik' }))
    await user.click(screen.getByRole('radio', { name: 'Yoğun' }))
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    expect(await screen.findByText('Tercihlerin kaydedildi')).toBeInTheDocument()
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(put?.[1]?.body))).toEqual(saved)
  })
})
