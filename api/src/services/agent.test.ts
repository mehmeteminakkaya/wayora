import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatWithAgent } from './agent.ts'
import type { Db } from '../lib/prisma.ts'

vi.mock('./duffel.ts', () => ({
  resolveAirportCode: (value: string) => (value.includes('İstanbul') ? 'IST' : 'BER'),
  searchDuffelFlights: async () => ({
    mode: 'test',
    offers: [
      {
        id: 'o1',
        airline: 'Test Havayolu',
        price: 120,
        currency: 'EUR',
        stops: 0,
        duration: '2s 45dk',
        departureAt: '2026-12-05T09:00:00',
        arrivalAt: '2026-12-05T11:45:00',
        from: 'IST',
        to: 'BER',
      },
    ],
  }),
}))

const config = {
  DEEPSEEK_API_KEY: 'test-key',
  DEEPSEEK_MODEL: 'deepseek-chat',
  LLM_TIMEOUT_MS: 1000,
  DISCOVERY_TIMEOUT_MS: 1000,
}
const db = {
  city: { findMany: async () => [] },
} as unknown as Db

const reply = (message: unknown) => ({ ok: true, json: async () => ({ choices: [{ message }] }) })

afterEach(() => vi.unstubAllGlobals())

describe('chatWithAgent', () => {
  it('araç çağırmadan yanıt döndürür', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ role: 'assistant', content: ' Selam! ' }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await chatWithAgent([{ role: 'user', content: 'Roma?' }], config, db)
    expect(result).toEqual({ reply: 'Selam!', actions: [] })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.messages[0].role).toBe('system')
    expect(body.tools.length).toBeGreaterThan(0)
  })

  it('open_page aracı site içi yönlendirme eylemi üretir', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'c1',
              function: { name: 'open_page', arguments: '{"page":"city","citySlug":"roma"}' },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(reply({ role: 'assistant', content: 'Açtım.' }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await chatWithAgent([{ role: 'user', content: 'Roma aç' }], config, db)
    expect(result.reply).toBe('Açtım.')
    expect(result.actions).toEqual([{ kind: 'navigate', label: 'Şehri aç', path: '/kesfet/roma' }])
  })

  it('geçersiz slug yönlendirmesini reddeder', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'c1',
              function: { name: 'open_page', arguments: '{"page":"city","citySlug":"../evil"}' },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(reply({ role: 'assistant', content: 'Olmadı.' }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await chatWithAgent([{ role: 'user', content: 'x' }], config, db)
    expect(result.actions).toEqual([])
  })

  it('uçuş test modunu yanıtta açıkça işaretler ve rotaya yönlendirir', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        reply({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'f1',
              function: {
                name: 'find_flights',
                arguments:
                  '{"origin":"İstanbul","destination":"Berlin","departureDate":"2026-12-05"}',
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        reply({ role: 'assistant', content: 'Fiyatlar test verisidir; rota oluşturabiliriz.' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await chatWithAgent(
      [{ role: 'user', content: 'Berlin uçuşu?' }],
      { ...config, DUFFEL_ACCESS_TOKEN: 'duffel_test_token' },
      db,
    )

    const toolMessage = JSON.parse(
      JSON.parse(fetchMock.mock.calls[1][1].body as string).messages.at(-1).content as string,
    )
    expect(toolMessage.mode).toBe('test')
    expect(toolMessage.note).toMatch(/test/i)
    expect(result.actions).toEqual([
      { kind: 'flight', label: 'Uçuş fikri için rota oluştur', path: '/trips/new?destination=Berlin' },
    ])
  })

  it('anahtar yoksa hata verir', async () => {
    await expect(
      chatWithAgent([{ role: 'user', content: 'x' }], { ...config, DEEPSEEK_API_KEY: undefined }, db),
    ).rejects.toThrow('DEEPSEEK_API_KEY')
  })
})
