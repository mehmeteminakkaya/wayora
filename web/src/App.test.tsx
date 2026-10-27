import { render, screen } from '@testing-library/react'
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
})
