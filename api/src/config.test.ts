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
})
