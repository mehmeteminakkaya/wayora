import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { loadConfig } from '../config.ts'
import { createFakeDb } from '../test/fake-db.ts'

const config = loadConfig({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })

function appWithoutCityTables() {
  return createApp({
    corsOrigin: 'http://localhost:5180',
    checkDb: async () => {},
    db: createFakeDb(),
    config,
  })
}

describe('şehir keşif API', () => {
  it('veritabanı boşken statik katalogla 10 şehir döner', async () => {
    const response = await request(appWithoutCityTables()).get('/api/cities')
    expect(response.status).toBe(200)
    expect(response.body.cities).toHaveLength(10)
    expect(response.body.cities[0]).toMatchObject({
      slug: 'istanbul',
      experienceCount: 10,
    })
  })

  it('şehir detayında deneyimleri ve fiyatları döner', async () => {
    const response = await request(appWithoutCityTables()).get('/api/cities/paris')
    expect(response.status).toBe(200)
    expect(response.body.city.name).toBe('Paris')
    expect(response.body.city.experiences).toHaveLength(10)
    expect(response.body.city.experiences[0]).toMatchObject({
      name: 'Louvre Müzesi',
      estimatedCost: 22,
    })
  })

  it('bilinmeyen şehir için 404 döner', async () => {
    const response = await request(appWithoutCityTables()).get('/api/cities/olmayan-sehir')
    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('CITY_NOT_FOUND')
  })
})

describe('şehir arama API', () => {
  it('şehir adı, ülke ve takma adla şehir bulur', async () => {
    const byAlias = await request(appWithoutCityTables())
      .get('/api/cities/search')
      .query({ q: 'constantinople' })
    expect(byAlias.status).toBe(200)
    expect(byAlias.body.cities[0]).toMatchObject({ slug: 'istanbul', name: 'İstanbul' })

    const byCountry = await request(appWithoutCityTables())
      .get('/api/cities/search')
      .query({ q: 'italya' })
    expect(byCountry.status).toBe(200)
    expect(byCountry.body.cities).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: 'roma' })]),
    )
  })

  it('deneyim adı ve etiketlerinde arar, şehir bilgisini ekler', async () => {
    const response = await request(appWithoutCityTables())
      .get('/api/cities/search')
      .query({ q: 'gastronomi' })

    expect(response.status).toBe(200)
    expect(response.body.cities).toHaveLength(0)
    expect(response.body.experiences.length).toBeGreaterThan(0)
    expect(response.body.experiences[0]).toMatchObject({
      citySlug: expect.any(String),
      cityName: expect.any(String),
      name: expect.any(String),
      estimatedCost: expect.any(Number),
    })
  })

  it('Türkçe karakterlerden bağımsız eşleşir', async () => {
    const response = await request(appWithoutCityTables())
      .get('/api/cities/search')
      .query({ q: 'muze' })

    expect(response.status).toBe(200)
    expect(response.body.experiences.length).toBeGreaterThan(0)
  })

  it('boş aramada boş listeler, uzun aramada 400 döner', async () => {
    const empty = await request(appWithoutCityTables()).get('/api/cities/search')
    expect(empty.status).toBe(200)
    expect(empty.body).toEqual({ cities: [], experiences: [] })

    const tooLong = await request(appWithoutCityTables())
      .get('/api/cities/search')
      .query({ q: 'a'.repeat(81) })
    expect(tooLong.status).toBe(400)
    expect(tooLong.body.error.code).toBe('VALIDATION_ERROR')
  })
})
