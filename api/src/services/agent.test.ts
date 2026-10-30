import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatWithAgent } from './agent.ts'

const config = { DEEPSEEK_API_KEY: 'test-key', DEEPSEEK_MODEL: 'deepseek-chat', LLM_TIMEOUT_MS: 1000 }

afterEach(() => vi.unstubAllGlobals())

describe('chatWithAgent', () => {
  it('sistem istemi ile DeepSeek çağırır ve yanıtı döndürür', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: ' Selam! ' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const reply = await chatWithAgent([{ role: 'user', content: 'Roma?' }], config)
    expect(reply).toBe('Selam!')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Roma?' })
  })

  it('anahtar yoksa hata verir', async () => {
    await expect(
      chatWithAgent([{ role: 'user', content: 'x' }], { ...config, DEEPSEEK_API_KEY: undefined }),
    ).rejects.toThrow('DEEPSEEK_API_KEY')
  })
})
