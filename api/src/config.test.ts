import { describe, expect, it } from 'vitest'
import { loadConfig } from './config.ts'

describe('loadConfig', () => {
  it('varsayılanları uygular', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x' })
    expect(config.PORT).toBe(4000)
    expect(config.NODE_ENV).toBe('development')
  })

  it('API_PORT, PORT değişkeninden önce gelir', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x', PORT: '5180', API_PORT: '4000' })
    expect(config.PORT).toBe(4000)
  })

  it('DATABASE_URL yoksa anlaşılır bir hata verir', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/)
  })

  it('geliştirmede JWT_SECRET yoksa geliştirme anahtarını kullanır', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x' })
    expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32)
  })

  it('üretimde JWT_SECRET zorunludur', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET/,
    )
  })

  it('kısa JWT_SECRET kabul edilmez', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgresql://x', JWT_SECRET: 'kisa' })).toThrow(
      /JWT_SECRET/,
    )
  })
})
