import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, Button, Field } from './ui'

describe('Field', () => {
  it('etiketi girdiye bağlar', () => {
    render(<Field label="E-posta" />)
    expect(screen.getByLabelText('E-posta')).toBeInTheDocument()
  })

  it('hata mesajını gösterir ve girdiyi geçersiz işaretler', () => {
    render(<Field label="Şifre" error="Şifre en az 8 karakter olmalı" />)
    const input = screen.getByLabelText('Şifre')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Şifre en az 8 karakter olmalı')
  })
})

describe('Button', () => {
  it('varsayılan olarak form göndermeyen birincil buton üretir', () => {
    render(<Button>Kaydet</Button>)
    const button = screen.getByRole('button', { name: 'Kaydet' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('btn-primary')
  })
})

describe('Alert', () => {
  it('hata uyarısını ekran okuyuculara duyurur', () => {
    render(<Alert kind="error">Bir şeyler ters gitti</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Bir şeyler ters gitti')
  })
})
