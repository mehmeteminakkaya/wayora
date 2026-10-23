import type { z } from 'zod'
import { HttpError } from '../middleware/error.ts'

// İstek gövdesini doğrular; hata varsa alan bazında Türkçe mesajlarla 400 fırlatır:
// { error: { code: 'VALIDATION', message, fields: { email: '...' } } }
export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body)
  if (result.success) return result.data
  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_'
    fields[key] ??= issue.message
  }
  throw new HttpError(400, 'VALIDATION', result.error.issues[0]?.message ?? 'Geçersiz istek', fields)
}
