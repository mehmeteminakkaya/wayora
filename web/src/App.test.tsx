import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('API ve veritabanı çalışırken durumu gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok', db: 'ok' }))),
    )
    render(<App />)
    expect(await screen.findByText(/API çalışıyor · Veritabanı: bağlı/)).toBeInTheDocument()
  })

  it('API kapalıyken uyarı gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<App />)
    expect(await screen.findByText('API’ye ulaşılamıyor')).toBeInTheDocument()
  })
})
