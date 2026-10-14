import type { ErrorRequestHandler, RequestHandler } from 'express'

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

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'İstenen kaynak bulunamadı'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu' } })
}
