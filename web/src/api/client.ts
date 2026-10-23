// Prod'da VITE_API_URL ile ayrı bir API adresi verilebilir; dev'de Vite proxy kullanılır.
const API_URL = import.meta.env.VITE_API_URL ?? ''

// API'nin standart hata biçimi: { error: { code, message, fields? } } — bkz. docs/ARCHITECTURE.md
export class ApiError extends Error {
  status: number
  code: string
  fields: Record<string, string>

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Sunucuya ulaşılamıyor. İnternet bağlantını kontrol et.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = data?.error
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? 'Beklenmeyen bir hata oluştu',
      err?.fields,
    )
  }
  return data as T
}
