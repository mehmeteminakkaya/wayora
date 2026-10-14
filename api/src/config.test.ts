import { describe, expect, it } from 'vitest'
import { loadConfig } from './config.ts'

describe('loadConfig', () => {
  it('varsayılanları uygular', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://x' })
    expect(config.PORT).toBe(4000)
    expect(config.NODE_ENV).toBe('development')
  })

  it('DATABASE_URL yoksa anlaşılır bir hata verir', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/)
  })
})
