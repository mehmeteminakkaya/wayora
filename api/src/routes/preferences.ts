import { Router } from 'express'
import { z } from 'zod'
import type { Config } from '../config.ts'
import { BUDGET_LEVELS, PACES, TRAVEL_STYLES } from '../domain.ts'
import type { Db } from '../lib/prisma.ts'
import { requireAuth } from '../middleware/auth.ts'
import { parseOrThrow } from '../middleware/error.ts'

const preferenceSchema = z.object({
  interests: z.array(z.string().trim().min(1).max(40)).max(12),
  budgetLevel: z.enum(BUDGET_LEVELS),
  travelStyle: z.enum(TRAVEL_STYLES),
  pace: z.enum(PACES),
})

type PreferenceRecord = {
  id: string
  interests: string[]
  budgetLevel: string
  travelStyle: string
  pace: string
  updatedAt: Date
}

function serialize(preference: PreferenceRecord) {
  return {
    id: preference.id,
    interests: preference.interests,
    budgetLevel: preference.budgetLevel,
    travelStyle: preference.travelStyle,
    pace: preference.pace,
    updatedAt: preference.updatedAt.toISOString(),
  }
}

export function preferenceRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.get('/', async (req, res) => {
    const preference = await db.preference.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId! },
      update: {},
    })
    res.json({ preference: serialize(preference) })
  })

  router.put('/', async (req, res) => {
    const input = parseOrThrow(preferenceSchema, req.body)
    const preference = await db.preference.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, ...input },
      update: input,
    })
    res.json({ preference: serialize(preference) })
  })

  return router
}
