import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

const user = { id: 'u1', email: 'ayse@example.com', name: 'Ayşe' }

async function signIn(password = 'gizli-sifre-123') {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('E-posta'), user.email)
  await u.type(screen.getByLabelText('Şifre'), password)
  await u.click(screen.getByRole('button', { name: 'Giriş yap' }))
}

describe('Giriş ve korumalı sayfalar (W-11)', () => {
  it('oturum yokken korumalı sayfa giriş ekranına yönlendirir', async () => {
    mockApi({ 'GET /api/auth/me': [401] })
    const { router } = renderAt('/tercihler')
    expect(await screen.findByRole('heading', { name: 'Giriş yap' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/giris')
  })

  it('girişten sonra gelmek istediği sayfaya döner ve menüde adını gösterir', async () => {
    mockApi({ 'GET /api/auth/me': [401], 'POST /api/auth/login': [200, { user }] })
    const { router } = renderAt('/tercihler')
    await screen.findByRole('heading', { name: 'Giriş yap' })
    await signIn()
    expect(await screen.findByRole('heading', { name: 'Tercihlerin' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/tercihler')
    expect(screen.getByText('Ayşe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Çıkış yap' })).toBeInTheDocument()
  })

  it('hatalı bilgilerde sunucunun mesajını gösterir', async () => {
    mockApi({
      'GET /api/auth/me': [401],
      'POST /api/auth/login': [
        401,
        { error: { code: 'INVALID_CREDENTIALS', message: 'E-posta veya şifre hatalı' } },
      ],
    })
    renderAt('/giris')
    await signIn('yanlis-sifre')
    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı')
  })

  it('çıkış başarısız olursa kullanıcıya söyler ve oturumu açık gösterir', async () => {
    mockApi({ 'GET /api/auth/me': [200, { user }], 'POST /api/auth/logout': [502] })
    renderAt('/tercihler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Çıkış yap' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Çıkış yapılamadı, tekrar dene')
    expect(screen.getByRole('button', { name: 'Çıkış yap' })).toBeInTheDocument()
  })

  it('çıkış yapınca menü giriş bağlantısına döner', async () => {
    mockApi({ 'GET /api/auth/me': [200, { user }], 'POST /api/auth/logout': [204] })
    renderAt('/tercihler')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Çıkış yap' }))
    expect(await screen.findByRole('link', { name: 'Giriş yap' })).toBeInTheDocument()
  })
})
