import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

describe('Ana sayfa', () => {
  it('API ve veritabanı çalışırken durumu gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok', db: 'ok' }))),
    )
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
    renderAt('/yok-boyle-bir-sayfa')
    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ana sayfaya dön' })).toHaveAttribute('href', '/')
  })
})
