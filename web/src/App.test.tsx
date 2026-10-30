import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './auth/AuthContext'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockApi(handler: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => Promise.resolve(handler(String(input)))),
  )
}

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const unauthorized = () =>
  jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Oturum yok' } }, 401)

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('landing sayfasını gösterir', async () => {
    mockApi(unauthorized)
    renderAt('/')
    expect(await screen.findByRole('heading', { name: /bir şehir/i })).toBeInTheDocument()
  })

  it('giriş sayfasını gösterir', async () => {
    mockApi(unauthorized)
    renderAt('/login')
    expect(await screen.findByRole('heading', { name: /giriş yap/i })).toBeInTheDocument()
  })

  it('giriş yapmamış kullanıcıyı korumalı sayfadan girişe yönlendirir', async () => {
    mockApi(unauthorized)
    renderAt('/trips')
    expect(await screen.findByRole('heading', { name: /giriş yap/i })).toBeInTheDocument()
  })

  it('giriş yapmış kullanıcıya boş gezi durumunu gösterir', async () => {
    mockApi((url) => {
      if (url.endsWith('/api/auth/me')) {
        return jsonResponse({ user: { id: 'u1', email: 'ada@example.com', name: 'Ada' } })
      }
      if (url.endsWith('/api/trips')) return jsonResponse({ trips: [] })
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'yok' } }, 404)
    })

    renderAt('/trips')
    expect(await screen.findByRole('heading', { name: 'Henüz rota yok.' })).toBeInTheDocument()
  })

  it('profili olmayan kullanıcıya güvenli profil başlangıcını gösterir', async () => {
    mockApi((url) => {
      if (url.endsWith('/api/auth/me')) {
        return jsonResponse({ user: { id: 'u1', email: 'ada@example.com', name: 'Ada' } })
      }
      if (url.endsWith('/api/social/profile')) {
        return jsonResponse({ profile: null, preferences: null })
      }
      if (url.endsWith('/api/social/connections')) {
        return jsonResponse({ incoming: [], outgoing: [], accepted: [] })
      }
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'yok' } }, 404)
    })

    renderAt('/yol-arkadaslari')
    expect(await screen.findByRole('heading', { name: 'Aynı yöne gidenler.' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Profilini aç, yol arkadaşını bul.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yol arkadaşı profili oluştur' })).toBeInTheDocument()
  })

  it('yol arkadaşı eşleşmesini ve güvenli bağlantı eylemini gösterir', async () => {
    mockApi((url) => {
      if (url.endsWith('/api/auth/me')) {
        return jsonResponse({ user: { id: 'u1', email: 'ada@example.com', name: 'Ada' } })
      }
      if (url.endsWith('/api/social/profile')) {
        return jsonResponse({
          profile: {
            displayName: 'Ada',
            bio: 'Müzeleri ve yerel mutfağı seven sakin bir gezgin.',
            languages: ['Türkçe'],
            hostingAvailable: false,
            hostingNote: null,
            visible: true,
            safetyAccepted: true,
          },
          preferences: {
            interests: ['Müze', 'Yemek'],
            pace: 'moderate',
            budgetLevel: 'mid',
            travelStyle: 'balanced',
          },
        })
      }
      if (url.endsWith('/api/social/connections')) {
        return jsonResponse({ incoming: [], outgoing: [], accepted: [] })
      }
      if (url.includes('/api/social/matches')) {
        return jsonResponse({
          total: 24,
          matches: [
            {
              userId: 'u2',
              displayName: 'Deniz',
              bio: 'Berlin’i yürüyerek keşfeden bir gezgin.',
              languages: ['Türkçe'],
              interests: ['Müze'],
              pace: 'moderate',
              travelStyle: 'balanced',
              hostingAvailable: true,
              hostingNote: 'Kısa bir çay sohbeti.',
              destination: 'Berlin',
              startDate: '2026-11-06',
              endDate: '2026-11-10',
              overlapDays: 3,
              score: 86,
              sharedInterests: ['museum'],
              reasons: ['3 gün aynı şehirde', 'Ortak ilgi: Müze'],
            },
          ],
        })
      }
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'yok' } }, 404)
    })

    renderAt('/yol-arkadaslari')
    expect(await screen.findByRole('heading', { name: 'Aynı yöne gidenler.' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Deniz' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bağlantı iste/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ev sahipliği/ }))
    expect(screen.getByRole('heading', { name: 'Deniz' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Tümü/ }))
    expect(screen.getByRole('button', { name: /Ortak ilgi/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Daha fazla eşleşme/ })).toBeInTheDocument()
  })
})
