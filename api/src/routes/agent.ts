import { Router } from 'express'
import { z } from 'zod'
import type { Config } from '../config.ts'
import type { Db } from '../lib/prisma.ts'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError, parseOrThrow } from '../middleware/error.ts'
import { chatWithAgent } from '../services/agent.ts'

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
})

export function agentRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.post('/chat', async (req, res) => {
    const { messages } = parseOrThrow(chatSchema, req.body)
    if (messages[messages.length - 1].role !== 'user') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Son mesaj kullanıcıdan olmalı')
    }
    if (!config.DEEPSEEK_API_KEY) {
      throw new HttpError(503, 'AGENT_UNAVAILABLE', 'Asistan şu an yapılandırılmamış.')
    }
    try {
      res.json(await chatWithAgent(messages, config, db))
    } catch {
      throw new HttpError(502, 'AGENT_FAILED', 'Asistan şu an yanıt veremiyor. Tekrar dene.')
    }
  })

  return router
}
