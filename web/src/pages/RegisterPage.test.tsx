import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderAt } from '../test-utils'

afterEach(() => vi.unstubAllGlobals())

async function fillForm(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-posta'), email)
  await user.type(screen.getByLabelText('Şifre'), password)
  await user.click(screen.getByRole('button', { name: 'Kayıt ol' }))
}

describe('Kayıt sayfası (W-10)', () => {
  it('geçersiz e-posta ve kısa şifre için istek atmadan Türkçe hata gösterir', async () => {
    const fetchMock = mockApi({})
    renderAt('/kayit')
    await fillForm('ayse', 'kisa')
    expect(screen.getByLabelText('E-posta')).toHaveAccessibleDescription(
      'Geçerli bir e-posta adresi girin',
    )
    expect(screen.getByLabelText('Şifre')).toHaveAccessibleDescription(
      'Şifre en az 8 karakter olmalı',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('kayıtlı e-postada sunucunun alan hatasını gösterir', async () => {
    mockApi({
      'POST /api/auth/register': [
        409,
        {
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Bu e-posta adresiyle zaten bir hesap var',
            fields: { email: 'Bu e-posta adresiyle zaten bir hesap var' },
          },
        },
      ],
    })
    renderAt('/kayit')
    await fillForm('ayse@example.com', 'gizli-sifre-123')
    expect(await screen.findByText('Bu e-posta adresiyle zaten bir hesap var')).toBeInTheDocument()
  })

  it('başarılı kayıttan sonra tercih ekranına yönlendirir', async () => {
    mockApi({
      'POST /api/auth/register': [201, { user: { id: 'u1', email: 'ayse@example.com', name: null } }],
    })
    const { router } = renderAt('/kayit')
    await fillForm('ayse@example.com', 'gizli-sifre-123')
    expect(await screen.findByRole('heading', { name: 'Tercihlerin' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/tercihler')
  })
})
