import { Router } from 'express'
import { z } from 'zod'
import { parseBody } from '../lib/validation.ts'
import { currentUserId } from '../middleware/auth.ts'
import type { Store } from '../store/types.ts'

// Seçilebilecek ilgi alanları. Arayüzdeki Türkçe etiketler: web/src/pages/PreferencesPage.tsx
export const INTERESTS = [
  'museum',
  'history',
  'art',
  'nature',
  'food',
  'shopping',
  'nightlife',
  'beach',
  'adventure',
] as const

const preferencesSchema = z.object({
  interests: z
    .array(z.enum(INTERESTS, { error: 'Bilinmeyen ilgi alanı' }), { error: 'İlgi alanları zorunlu' })
    .min(1, { error: 'En az bir ilgi alanı seç' })
    .transform((list) => [...new Set(list)]),
  budgetLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'], { error: 'Bütçe seviyesi seç' }),
  pace: z.enum(['RELAXED', 'BALANCED', 'PACKED'], { error: 'Tempo seç' }),
  travelStyle: z
    .enum(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS'], { error: 'Geçersiz seyahat tarzı' })
    .nullish()
    .transform((s) => s ?? null),
})

// requireAuth'tan sonra bağlanır (app.ts)
export function preferencesRouter(store: Store) {
  const router = Router()

  router.get('/', async (_req, res) => {
    res.json({ preferences: await store.preferences.get(currentUserId(res)) })
  })

  router.put('/', async (req, res) => {
    const input = parseBody(preferencesSchema, req.body)
    res.json({ preferences: await store.preferences.save(currentUserId(res), input) })
  })

  return router
}
