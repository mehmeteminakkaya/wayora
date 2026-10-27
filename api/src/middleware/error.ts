import type { ErrorRequestHandler, RequestHandler } from 'express'
import { z } from 'zod'

// Tüm API hataları aynı biçimde döner: { error: { code, message } } — bkz. docs/ARCHITECTURE.md
export class HttpError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const location = issue?.path.join('.')
    const message = location ? `${location}: ${issue.message}` : (issue?.message ?? 'Geçersiz istek')
    throw new HttpError(400, 'VALIDATION_ERROR', message)
  }
  return parsed.data
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'İstenen kaynak bulunamadı'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }
  // express.json() bozuk gövde gönderildiğinde SyntaxError fırlatır.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'İstek gövdesi geçerli JSON değil' } })
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu' } })
}
