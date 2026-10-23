import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const loggedOut = { 'GET /api/auth/me': [401] as [number] }

describe('Ana sayfa', () => {
  it('API ve veritabanı çalışırken durumu gösterir', async () => {
    mockApi({ ...loggedOut, 'GET /api/health': [200, { status: 'ok', db: 'ok' }] })
    renderAt('/')
    expect(await screen.findByText(/API çalışıyor · Veritabanı: bağlı/)).toBeInTheDocument()
  })

  it('API kapalıyken uyarı gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderAt('/')
    expect(await screen.findByText('API’ye ulaşılamıyor')).toBeInTheDocument()
  })
})

describe('Bilinmeyen adres', () => {
  it('bulunamadı sayfasını ve ana sayfa bağlantısını gösterir', () => {
    mockApi(loggedOut)
    renderAt('/yok-boyle-bir-sayfa')
    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ana sayfaya dön' })).toHaveAttribute('href', '/')
  })
})
