import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildResearchQuery, searchDeepSeekWeb } from './deepseek-search.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeepSeek web search', () => {
  it('arama sonuçlarını kaynak URL ve özetle normalize eder', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              {
                title: 'Berlin Gezi Rehberi',
                url: 'https://example.com/berlin',
                summary: 'Müzeler ve semtler hakkında güncel bilgiler.',
                site_name: 'Example',
              },
              { title: 'URL yok', summary: 'Bu sonuç atılmalı.' },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const results = await searchDeepSeekWeb({
      query: 'Berlin gezi rehberi',
      apiKey: 'test-key',
      timeoutMs: 1000,
    })

    expect(results).toEqual([
      {
        title: 'Berlin Gezi Rehberi',
        url: 'https://example.com/berlin',
        text: 'Müzeler ve semtler hakkında güncel bilgiler.',
        siteName: 'Example',
      },
    ])
  })

  it('kullanıcı girdisinden sınırlı bir araştırma sorgusu üretir', () => {
    const query = buildResearchQuery({
      destination: 'Berlin',
      startDate: new Date('2026-11-05T00:00:00.000Z'),
      interests: ['museum', 'food'],
    })
    expect(query).toContain('Berlin')
    expect(query).toContain('Kasım 2026')
    expect(query.length).toBeLessThanOrEqual(128)
  })
})
