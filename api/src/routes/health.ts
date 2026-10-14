import { Router } from 'express'

export function healthRouter(checkDb: () => Promise<void>) {
  const router = Router()

  router.get('/', async (_req, res) => {
    let db: 'ok' | 'error' = 'ok'
    try {
      await checkDb()
    } catch {
      db = 'error'
    }
    res.json({ status: 'ok', db })
  })

  return router
}
