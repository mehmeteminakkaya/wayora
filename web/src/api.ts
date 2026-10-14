// Prod'da VITE_API_URL ile ayrı bir API adresi verilebilir; dev'de Vite proxy kullanılır.
const API_URL = import.meta.env.VITE_API_URL ?? ''

export type Health = { status: 'ok'; db: 'ok' | 'error' }

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/api/health`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
