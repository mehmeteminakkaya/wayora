import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, signedInAgent } from '../test-app.ts'

const valid = { interests: ['museum', 'food'], budgetLevel: 'MEDIUM', pace: 'BALANCED' }

describe('/api/me/preferences (W-12)', () => {
  it('oturum olmadan 401 döner', async () => {
    const { app } = createTestApp()
    expect((await request(app).get('/api/me/preferences')).status).toBe(401)
    expect((await request(app).put('/api/me/preferences').send(valid)).status).toBe(401)
  })

  it('henüz kayıt yoksa null döner', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent.get('/api/me/preferences')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ preferences: null })
  })

  it('tercihleri kaydeder, günceller ve geri okur', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const saved = await agent.put('/api/me/preferences').send(valid)
    expect(saved.status).toBe(200)
    expect(saved.body.preferences).toEqual({ ...valid, travelStyle: null })

    await agent
      .put('/api/me/preferences')
      .send({ ...valid, interests: ['nature'], pace: 'RELAXED', travelStyle: 'FAMILY' })
    const res = await agent.get('/api/me/preferences')
    expect(res.body.preferences).toEqual({
      interests: ['nature'],
      budgetLevel: 'MEDIUM',
      pace: 'RELAXED',
      travelStyle: 'FAMILY',
    })
  })

  it('tekrarlanan ilgi alanlarını birleştirir', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)
    const res = await agent
      .put('/api/me/preferences')
      .send({ ...valid, interests: ['food', 'food', 'art'] })
    expect(res.body.preferences.interests).toEqual(['food', 'art'])
  })

  it('boş ya da bilinmeyen ilgi alanı ve eksik alanlar için Türkçe hata döner', async () => {
    const { app } = createTestApp()
    const agent = await signedInAgent(app)

    const empty = await agent.put('/api/me/preferences').send({ ...valid, interests: [] })
    expect(empty.status).toBe(400)
    expect(empty.body.error.fields.interests).toBe('En az bir ilgi alanı seç')

    const unknown = await agent.put('/api/me/preferences').send({ ...valid, interests: ['uzay'] })
    expect(unknown.body.error.fields['interests.0']).toBe('Bilinmeyen ilgi alanı')

    const missing = await agent.put('/api/me/preferences').send({ interests: ['art'] })
    expect(missing.body.error.fields).toMatchObject({ budgetLevel: 'Bütçe seviyesi seç', pace: 'Tempo seç' })
  })

  it('her kullanıcı yalnızca kendi tercihlerini görür', async () => {
    const { app } = createTestApp()
    const ayse = await signedInAgent(app, 'ayse@example.com')
    const ali = await signedInAgent(app, 'ali@example.com')
    await ayse.put('/api/me/preferences').send(valid)
    expect((await ali.get('/api/me/preferences')).body.preferences).toBeNull()
  })
})
