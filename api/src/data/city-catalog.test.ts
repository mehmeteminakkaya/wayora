import { describe, expect, it } from 'vitest'
import { CITY_CATALOG, catalogGooglePlaceId } from './city-catalog.ts'
import { findCandidates } from './places.ts'

describe('şehir kataloğu', () => {
  it('10 şehir ve her şehirde en az 10 deneyim içerir', () => {
    expect(CITY_CATALOG).toHaveLength(10)
    for (const city of CITY_CATALOG) {
      expect(city.experiences.length, city.name).toBeGreaterThanOrEqual(10)
      expect(city.summary.length, city.name).toBeGreaterThan(20)
    }
  })

  it('deneyim kimlikleri ve slugları benzersizdir', () => {
    const ids = new Set<string>()
    for (const city of CITY_CATALOG) {
      for (const experience of city.experiences) {
        const id = catalogGooglePlaceId(city.slug, experience.slug)
        expect(ids.has(id), id).toBe(false)
        ids.add(id)
        expect(experience.estimatedCost).toBeGreaterThanOrEqual(0)
        expect(experience.durationMinutes).toBeGreaterThan(0)
        expect(experience.name.length).toBeGreaterThan(1)
        expect(experience.description.length).toBeGreaterThan(20)
      }
    }
    expect(ids.size).toBe(100)
  })

  it('şehir adları ve takma adları aday üretir', () => {
    for (const city of CITY_CATALOG) {
      expect(findCandidates(city.name).length, city.name).toBeGreaterThanOrEqual(10)
    }
    expect(findCandidates('Barcelona')).toHaveLength(10)
    expect(findCandidates('Prague')).toHaveLength(10)
    expect(findCandidates('Wien')).toHaveLength(10)
    expect(findCandidates('Lisboa')).toHaveLength(10)
    expect(findCandidates('Bilinmeyen Şehir')).toHaveLength(0)
  })
})
