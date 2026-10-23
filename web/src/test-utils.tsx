import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { routes } from './routes'

// Uygulamayı verilen adreste, gerçek yönlendirme tablosuyla render eder
export function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

// fetch'i adres+metot bazlı sahte yanıtlarla değiştirir: { 'POST /api/auth/register': [201, {...}] }
export function mockApi(routes: Record<string, [number, unknown?]>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    const match = routes[key]
    if (!match) {
      const error = { code: 'NOT_FOUND', message: key }
      return new Response(JSON.stringify({ error }), { status: 404 })
    }
    const [status, body] = match
    return new Response(status === 204 ? null : JSON.stringify(body ?? {}), { status })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
