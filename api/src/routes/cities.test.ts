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
