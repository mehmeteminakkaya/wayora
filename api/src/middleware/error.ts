import type { ErrorRequestHandler, RequestHandler } from 'express'

// Tüm API hataları aynı biçimde döner: { error: { code, message } } — bkz. docs/ARCHITECTURE.md
// Doğrulama hatalarında `fields` alan bazında mesajları taşır: { email: '...', password: '...' }
export class HttpError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'İstenen kaynak bulunamadı'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const { code, message, fields } = err
    res.status(err.status).json({ error: fields ? { code, message, fields } : { code, message } })
    return
  }
  // express.json() bozuk JSON'da 400 fırlatır
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'BAD_JSON', message: 'İstek gövdesi geçerli JSON değil' } })
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu' } })
}
