import { describe, expect, it } from 'vitest'
import { dayCount, isValidDay, tripDays } from './dates.ts'

describe('tarih yardımcıları', () => {
  it('geçerli günleri tanır, takvimde olmayanları reddeder', () => {
    expect(isValidDay('2026-11-02')).toBe(true)
    expect(isValidDay('2026-02-30')).toBe(false)
    expect(isValidDay('2026-2-3')).toBe(false)
    expect(isValidDay('yarın')).toBe(false)
  })

  it('başlangıç ve bitiş dahil gün sayar', () => {
    expect(dayCount('2026-11-02', '2026-11-02')).toBe(1)
    expect(dayCount('2026-11-02', '2026-11-04')).toBe(3)
  })

  it('ay ve yıl geçişlerinde günleri doğru üretir', () => {
    expect(tripDays('2026-12-30', '2027-01-02')).toEqual([
      { dayIndex: 1, date: '2026-12-30' },
      { dayIndex: 2, date: '2026-12-31' },
      { dayIndex: 3, date: '2027-01-01' },
      { dayIndex: 4, date: '2027-01-02' },
    ])
  })

  it('yaz saati değişiminde gün kaybetmez', () => {
    // Türkiye'de yaz saati yok ama Avrupa'da 2026-10-25'te var; UTC ile çalışıldığı için etkilenmez
    expect(tripDays('2026-10-24', '2026-10-26').map((d) => d.date)).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
  })
})
