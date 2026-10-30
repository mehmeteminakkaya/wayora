const CITY_SLUGS: Record<string, string> = {
  istanbul: 'istanbul',
  paris: 'paris',
  roma: 'rome',
  rome: 'rome',
  barselona: 'barcelona',
  barcelona: 'barcelona',
  londra: 'london',
  london: 'london',
  amsterdam: 'amsterdam',
  berlin: 'berlin',
  prag: 'prague',
  prague: 'prague',
  viyana: 'vienna',
  vienna: 'vienna',
  lizbon: 'lisbon',
  lisbon: 'lisbon',
  madrid: 'madrid',
  floransa: 'florence',
  florence: 'florence',
  venedik: 'venice',
  venice: 'venice',
  atina: 'athens',
  athens: 'athens',
}

const CITY_LABELS: Record<string, string> = {
  istanbul: 'İstanbul',
  paris: 'Paris',
  rome: 'Roma',
  barcelona: 'Barselona',
  london: 'Londra',
  amsterdam: 'Amsterdam',
  berlin: 'Berlin',
  prague: 'Prag',
  vienna: 'Viyana',
  lisbon: 'Lizbon',
  madrid: 'Madrid',
  florence: 'Floransa',
  venice: 'Venedik',
  athens: 'Atina',
}

const CATEGORY_LABELS: Record<string, string> = {
  museum: 'Müze',
  food: 'Yemek',
  nature: 'Doğa',
  landmark: 'Gezilecek yer',
  shopping: 'Alışveriş',
  other: 'Deneyim',
  nightlife: 'Gece',
}

export function normalizeCityKey(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replaceAll('â', 'a')
    .replaceAll('î', 'i')
    .trim()
}

export function citySlug(value: string): string {
  const normalized = normalizeCityKey(value)
  return CITY_SLUGS[normalized] ?? normalized.replaceAll(' ', '-')
}

export function cityPhoto(value: string): string {
  return `/images/cities/${citySlug(value)}.jpg`
}

export function cityPhotoLabel(value: string): string {
  const slug = citySlug(value)
  return `FOTO · ${CITY_LABELS[slug] ?? value}`
}

const CITY_COORDS: Record<string, [number, number]> = {
  istanbul: [41.0082, 28.9784],
  paris: [48.8566, 2.3522],
  rome: [41.9028, 12.4964],
  barcelona: [41.3874, 2.1686],
  london: [51.5074, -0.1278],
  amsterdam: [52.3676, 4.9041],
  berlin: [52.52, 13.405],
  prague: [50.0755, 14.4378],
  vienna: [48.2082, 16.3738],
  lisbon: [38.7223, -9.1393],
  madrid: [40.4168, -3.7038],
  florence: [43.7696, 11.2558],
  venice: [45.4408, 12.3155],
  athens: [37.9838, 23.7275],
}

export function cityCoords(value: string): [number, number] {
  return CITY_COORDS[citySlug(value)] ?? CITY_COORDS.rome
}

export function categoryPhoto(category: string): string {
  const known = ['museum', 'food', 'nature', 'landmark', 'shopping', 'nightlife']
  return `/images/categories/${known.includes(category) ? category : 'landmark'}.jpg`
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other
}
