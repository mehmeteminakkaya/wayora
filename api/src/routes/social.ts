import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError, parseOrThrow } from '../middleware/error.ts'
import { normalizeCity } from '../data/city-catalog.ts'
import type { Config } from '../config.ts'
import type { Db } from '../lib/prisma.ts'
import { toDateOnly } from '../lib/serialize.ts'
import {
  overlapDays,
  scoreCandidate,
  type SocialCandidate,
  type SocialContext,
  type SocialTrip,
} from '../services/social.ts'

const languagesSchema = z
  .array(z.string().trim().min(2).max(30))
  .max(6, 'En fazla 6 dil ekleyebilirsin')

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Görünen ad en az 2 karakter olmalı').max(80),
  bio: z.string().trim().min(20, 'Kısa tanıtım en az 20 karakter olmalı').max(240),
  languages: languagesSchema,
  hostingAvailable: z.boolean().default(false),
  hostingNote: z.string().trim().max(160, 'Ev sahipliği notu en fazla 160 karakter olabilir').nullable().optional(),
  visible: z.boolean().default(false),
  safetyAccepted: z.boolean().default(false),
})

const requestSchema = z.object({
  recipientId: z.string().uuid(),
  message: z.string().trim().max(300, 'Mesaj en fazla 300 karakter olabilir').optional(),
})

const connectionActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
})

const messageSchema = z.object({
  body: z.string().trim().min(1, 'Mesaj boş olamaz').max(500, 'Mesaj en fazla 500 karakter olabilir'),
})

const reportSchema = z.object({
  reason: z.enum(['harassment', 'spam', 'safety', 'other']),
  details: z.string().trim().max(500).optional(),
})

const blockSchema = z.object({
  userId: z.string().uuid(),
})

function tripToSocial(trip: {
  id: string
  destination: string
  startDate: Date
  endDate: Date
}): SocialTrip {
  return {
    id: trip.id,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
  }
}

function profileView(profile: {
  displayName: string
  bio: string
  languages: string[]
  hostingAvailable: boolean
  hostingNote: string | null
  visible: boolean
  safetyAcceptedAt: Date | null
}) {
  return {
    displayName: profile.displayName,
    bio: profile.bio,
    languages: profile.languages,
    hostingAvailable: profile.hostingAvailable,
    hostingNote: profile.hostingNote,
    visible: profile.visible,
    safetyAccepted: Boolean(profile.safetyAcceptedAt),
  }
}

function otherUser(
  connection: {
    requester: { id: string; name: string | null; travelerProfile: { displayName: string } | null }
    recipient: { id: string; name: string | null; travelerProfile: { displayName: string } | null }
  },
  userId: string,
) {
  const user = connection.requester.id === userId ? connection.recipient : connection.requester
  return {
    id: user.id,
    name: user.travelerProfile?.displayName ?? user.name ?? 'Gezgin',
  }
}

function connectionView(
  connection: {
    id: string
    status: string
    message: string | null
    createdAt: Date
    requesterId: string
    recipientId: string
    requester: { id: string; name: string | null; travelerProfile: { displayName: string } | null }
    recipient: { id: string; name: string | null; travelerProfile: { displayName: string } | null }
  },
  userId: string,
) {
  return {
    id: connection.id,
    status: connection.status,
    message: connection.message,
    createdAt: connection.createdAt.toISOString(),
    direction: connection.requesterId === userId ? 'outgoing' : 'incoming',
    other: otherUser(connection, userId),
  }
}

async function getSocialContext(db: Db, userId: string): Promise<SocialContext> {
  const [preference, profile] = await Promise.all([
    db.preference.findUnique({ where: { userId } }),
    db.travelerProfile.findUnique({ where: { userId } }),
  ])
  return {
    interests: preference?.interests ?? [],
    pace: preference?.pace ?? 'moderate',
    languages: profile?.languages ?? [],
  }
}

async function getMyTrips(db: Db, userId: string): Promise<SocialTrip[]> {
  const trips = await db.trip.findMany({
    where: { userId },
    select: { id: true, destination: true, startDate: true, endDate: true },
    orderBy: { startDate: 'desc' },
  })
  return trips.map(tripToSocial)
}

async function getBlockedIds(db: Db, userId: string): Promise<Set<string>> {
  const blocks = await db.blockedUser.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  })
  const ids = new Set<string>()
  for (const block of blocks) {
    ids.add(block.blockerId === userId ? block.blockedId : block.blockerId)
  }
  return ids
}

export function socialRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.get('/profile', async (req, res) => {
    const profile = await db.travelerProfile.findUnique({ where: { userId: req.userId! } })
    const preference = await db.preference.findUnique({ where: { userId: req.userId! } })
    res.json({
      profile: profile ? profileView(profile) : null,
      preferences: preference
        ? {
            interests: preference.interests,
            pace: preference.pace,
            budgetLevel: preference.budgetLevel,
            travelStyle: preference.travelStyle,
          }
        : null,
    })
  })

  router.put('/profile', async (req, res) => {
    const input = parseOrThrow(profileSchema, req.body)
    const existing = await db.travelerProfile.findUnique({ where: { userId: req.userId! } })
    const acceptedAt = existing?.safetyAcceptedAt ?? (input.safetyAccepted ? new Date() : null)

    if ((input.visible || input.hostingAvailable) && !acceptedAt) {
      throw new HttpError(
        400,
        'SAFETY_ACCEPTANCE_REQUIRED',
        'Görünür olmak veya ev sahipliği açmak için güvenlik kurallarını kabul etmelisin.',
      )
    }

    const profile = await db.travelerProfile.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        displayName: input.displayName,
        bio: input.bio,
        languages: [...new Set(input.languages)],
        hostingAvailable: input.hostingAvailable,
        hostingNote: input.hostingNote ?? null,
        visible: input.visible,
        safetyAcceptedAt: acceptedAt,
      },
      update: {
        displayName: input.displayName,
        bio: input.bio,
        languages: [...new Set(input.languages)],
        hostingAvailable: input.hostingAvailable,
        hostingNote: input.hostingNote ?? null,
        visible: input.visible,
        safetyAcceptedAt: acceptedAt,
      },
    })
    res.json({ profile: profileView(profile) })
  })

  router.get('/matches', async (req, res) => {
    const userId = req.userId!
    const profile = await db.travelerProfile.findUnique({ where: { userId } })
    if (!profile || !profile.visible) {
      return res.json({ matches: [], reason: 'PROFILE_NOT_VISIBLE' })
    }

    const [myTrips, context, blockedIds, connections, candidates] = await Promise.all([
      getMyTrips(db, userId),
      getSocialContext(db, userId),
      getBlockedIds(db, userId),
      db.travelConnection.findMany({
        where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
        select: { requesterId: true, recipientId: true },
      }),
      db.trip.findMany({
        where: { userId: { not: userId } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              travelerProfile: true,
              preference: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      }),
    ])

    const connectedIds = new Set<string>()
    for (const connection of connections) {
      connectedIds.add(connection.requesterId === userId ? connection.recipientId : connection.requesterId)
    }

    const byUser = new Map<string, { candidate: SocialCandidate; trips: SocialTrip[] }>()
    for (const trip of candidates) {
      if (blockedIds.has(trip.user.id) || connectedIds.has(trip.user.id)) continue
      const traveler = trip.user.travelerProfile
      if (!traveler?.visible) continue
      const existing = byUser.get(trip.user.id)
      const socialTrip = tripToSocial(trip)
      if (existing) {
        existing.trips.push(socialTrip)
        continue
      }
      byUser.set(trip.user.id, {
        candidate: {
          userId: trip.user.id,
          displayName: traveler.displayName,
          bio: traveler.bio,
          languages: traveler.languages,
          hostingAvailable: traveler.hostingAvailable,
          hostingNote: traveler.hostingNote,
          interests: trip.user.preference?.interests ?? [],
          travelStyle: trip.user.preference?.travelStyle ?? 'balanced',
          pace: trip.user.preference?.pace ?? 'moderate',
          trips: [],
        },
        trips: [socialTrip],
      })
    }

    const rankedMatches = [...byUser.values()]
      .map((entry) =>
        scoreCandidate(myTrips, { ...entry.candidate, trips: entry.trips }, context),
      )
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .sort((a, b) => b.score - a.score)
    const total = rankedMatches.length
    const matches = rankedMatches
      .slice(0, 20)
      .map((match) => ({
        userId: match.candidate.userId,
        displayName: match.candidate.displayName,
        bio: match.candidate.bio,
        languages: match.candidate.languages,
        interests: match.candidate.interests,
        pace: match.candidate.pace,
        travelStyle: match.candidate.travelStyle,
        hostingAvailable: match.candidate.hostingAvailable,
        hostingNote: match.candidate.hostingNote,
        destination: match.trip.destination,
        startDate: toDateOnly(match.trip.startDate),
        endDate: toDateOnly(match.trip.endDate),
        overlapDays: match.overlapDays,
        score: match.score,
        sharedInterests: match.sharedInterests,
        reasons: match.reasons,
      }))

    res.json({ matches, total })
  })

  router.get('/connections', async (req, res) => {
    const userId = req.userId!
    const connections = await db.travelConnection.findMany({
      where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
      include: {
        requester: { select: { id: true, name: true, travelerProfile: true } },
        recipient: { select: { id: true, name: true, travelerProfile: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    const views = connections.map((connection) => connectionView(connection, userId))
    res.json({
      incoming: views.filter((item) => item.direction === 'incoming' && item.status === 'pending'),
      outgoing: views.filter((item) => item.direction === 'outgoing' && item.status === 'pending'),
      accepted: views.filter((item) => item.status === 'accepted'),
    })
  })

  router.post('/requests', async (req, res) => {
    const input = parseOrThrow(requestSchema, req.body)
    if (input.recipientId === req.userId) {
      throw new HttpError(400, 'SELF_REQUEST', 'Kendine yol arkadaşı isteği gönderemezsin.')
    }
    const targetProfile = await db.travelerProfile.findUnique({
      where: { userId: input.recipientId },
    })
    if (!targetProfile?.visible) {
      throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Bu yol arkadaşı profili görünür değil.')
    }
    const blocked = await db.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: req.userId!, blockedId: input.recipientId },
          { blockerId: input.recipientId, blockedId: req.userId! },
        ],
      },
    })
    if (blocked) {
      throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Bu yol arkadaşı profili görünür değil.')
    }
    const existing = await db.travelConnection.findFirst({
      where: {
        OR: [
          { requesterId: req.userId!, recipientId: input.recipientId },
          { requesterId: input.recipientId, recipientId: req.userId! },
        ],
      },
    })
    if (existing) {
      throw new HttpError(409, 'CONNECTION_EXISTS', 'Bu kişiyle zaten bir bağlantı isteğin var.')
    }

    const [myTrips, theirTrips] = await Promise.all([
      getMyTrips(db, req.userId!),
      db.trip.findMany({
        where: { userId: input.recipientId },
        select: { id: true, destination: true, startDate: true, endDate: true },
      }),
    ])
    const candidate = theirTrips.map(tripToSocial)
    const compatible = myTrips.some((myTrip) =>
      candidate.some(
        (theirTrip) =>
          overlapDays(myTrip, theirTrip) > 0 &&
          normalizeCity(myTrip.destination) === normalizeCity(theirTrip.destination),
      ),
    )
    if (!compatible) {
      throw new HttpError(
        400,
        'NO_SHARED_TRIP',
        'Bu kişiyle ortak şehir ve tarih aralığı bulunmuyor.',
      )
    }

    const connection = await db.travelConnection.create({
      data: {
        requesterId: req.userId!,
        recipientId: input.recipientId,
        message: input.message || null,
      },
      include: {
        requester: { select: { id: true, name: true, travelerProfile: true } },
        recipient: { select: { id: true, name: true, travelerProfile: true } },
      },
    })
    res.status(201).json({ connection: connectionView(connection, req.userId!) })
  })

  router.patch('/connections/:id', async (req, res) => {
    const input = parseOrThrow(connectionActionSchema, req.body)
    const userId = req.userId!
    const connection = await db.travelConnection.findFirst({
      where: { id: String(req.params.id), OR: [{ requesterId: userId }, { recipientId: userId }] },
      include: {
        requester: { select: { id: true, name: true, travelerProfile: true } },
        recipient: { select: { id: true, name: true, travelerProfile: true } },
      },
    })
    if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Bağlantı bulunamadı.')
    if (connection.status !== 'pending') {
      throw new HttpError(409, 'CONNECTION_NOT_PENDING', 'Bu bağlantı artık beklemede değil.')
    }

    if (input.action === 'accept' || input.action === 'decline') {
      if (connection.recipientId !== userId) {
        throw new HttpError(403, 'FORBIDDEN', 'Bu isteği yalnızca alıcı yanıtlayabilir.')
      }
    } else if (connection.requesterId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Bu isteği yalnızca gönderen iptal edebilir.')
    }

    const status = input.action === 'cancel' ? 'cancelled' : input.action === 'accept' ? 'accepted' : 'declined'
    const updated = await db.travelConnection.update({
      where: { id: connection.id },
      data: { status },
      include: {
        requester: { select: { id: true, name: true, travelerProfile: true } },
        recipient: { select: { id: true, name: true, travelerProfile: true } },
      },
    })
    res.json({ connection: connectionView(updated, userId) })
  })

  router.get('/connections/:id/messages', async (req, res) => {
    const userId = req.userId!
    const connection = await db.travelConnection.findFirst({
      where: {
        id: String(req.params.id),
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    })
    if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Bağlantı bulunamadı.')
    const messages = await db.connectionMessage.findMany({
      where: { connectionId: connection.id },
      include: { sender: { select: { id: true, name: true, travelerProfile: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
    res.json({
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderName: message.sender.travelerProfile?.displayName ?? message.sender.name ?? 'Gezgin',
        mine: message.senderId === userId,
        createdAt: message.createdAt.toISOString(),
      })),
    })
  })

  router.post('/connections/:id/messages', async (req, res) => {
    const input = parseOrThrow(messageSchema, req.body)
    const userId = req.userId!
    const connection = await db.travelConnection.findFirst({
      where: {
        id: String(req.params.id),
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    })
    if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Bağlantı bulunamadı.')
    const message = await db.connectionMessage.create({
      data: { connectionId: connection.id, senderId: userId, body: input.body },
    })
    res.status(201).json({ message: { id: message.id, body: message.body, createdAt: message.createdAt.toISOString() } })
  })

  router.post('/connections/:id/report', async (req, res) => {
    const input = parseOrThrow(reportSchema, req.body)
    const userId = req.userId!
    const connection = await db.travelConnection.findFirst({
      where: { id: String(req.params.id), OR: [{ requesterId: userId }, { recipientId: userId }] },
    })
    if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Bağlantı bulunamadı.')
    const reportedUserId = connection.requesterId === userId ? connection.recipientId : connection.requesterId
    await db.safetyReport.create({
      data: {
        reporterId: userId,
        reportedUserId,
        connectionId: connection.id,
        reason: input.reason,
        details: input.details ?? null,
      },
    })
    await db.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: reportedUserId } },
      create: { blockerId: userId, blockedId: reportedUserId },
      update: {},
    })
    await db.travelConnection.updateMany({
      where: {
        OR: [
          { requesterId: userId, recipientId: reportedUserId },
          { requesterId: reportedUserId, recipientId: userId },
        ],
      },
      data: { status: 'declined' },
    })
    res.status(201).json({ ok: true, message: 'Bildirim alındı ve kullanıcı engellendi.' })
  })

  router.post('/block', async (req, res) => {
    const input = parseOrThrow(blockSchema, req.body)
    if (input.userId === req.userId) {
      throw new HttpError(400, 'SELF_BLOCK', 'Kendini engelleyemezsin.')
    }
    await db.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId: input.userId } },
      create: { blockerId: req.userId!, blockedId: input.userId },
      update: {},
    })
    await db.travelConnection.updateMany({
      where: {
        OR: [
          { requesterId: req.userId!, recipientId: input.userId },
          { requesterId: input.userId, recipientId: req.userId! },
        ],
      },
      data: { status: 'declined' },
    })
    res.json({ ok: true })
  })

  return router
}
