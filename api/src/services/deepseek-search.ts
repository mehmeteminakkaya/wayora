import { z } from 'zod'

const responseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            title: z.string().optional(),
            url: z.string().url().optional(),
            snippet: z.string().optional(),
            summary: z.string().optional(),
            site_name: z.string().optional(),
          })
          .passthrough(),
      )
      .max(50)
      .default([]),
  })
  .passthrough()

export type WebSearchResult = {
  title: string
  url: string
  text: string
  siteName: string | null
}

/**
 * DeepSeek'in kendi web arama endpoint'i. Sonuçlar modelin planına bağlam
 * olarak verilir; kullanıcıya "canlı fiyat" diye gösterilmez.
 */
export async function searchDeepSeekWeb({
  query,
  apiKey,
  timeoutMs,
}: {
  query: string
  apiKey: string
  timeoutMs: number
}): Promise<WebSearchResult[]> {
  const response = await fetch('https://api.deepseek.com/v1/tools/search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: query.slice(0, 128), count: 6 }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`DeepSeek Search HTTP ${response.status}`)

  const parsed = responseSchema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new Error('DeepSeek Search geçersiz yanıt döndü')

  return parsed.data.results
    .filter((result): result is typeof result & { url: string } => Boolean(result.url))
    .map((result) => ({
      title: result.title?.trim() || result.site_name?.trim() || 'Web kaynağı',
      url: result.url,
      text: (result.summary ?? result.snippet ?? '').trim().slice(0, 1200),
      siteName: result.site_name ?? null,
    }))
    .filter((result) => result.text.length > 0)
    .slice(0, 5)
}

export function buildResearchQuery(input: {
  destination: string
  startDate: Date
  interests: string[]
}): string {
  const month = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(input.startDate)
  const interests = input.interests.slice(0, 3).join(' ')
  return `${input.destination} ${month} gezi rehberi müzeler yemek ulaşım ${interests}`
    .trim()
    .slice(0, 128)
}
