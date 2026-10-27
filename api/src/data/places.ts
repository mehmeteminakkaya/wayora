// AI anahtarı olmadan da çalışan yerleşik şehir kataloğu.
// Gerçek Google Places entegrasyonu geldiğinde bu dosya yalnızca yedek/offline kaynak olur.
import type { ActivityCategory } from '../domain.ts'

export type PlaceCandidate = {
  googlePlaceId: string
  name: string
  city: string
  lat: number
  lng: number
  address: string
  rating: number
  types: string[]
  category: ActivityCategory
  estimatedCost: number
  durationHours: number
}

const PLACES: PlaceCandidate[] = [
  // İstanbul
  { googlePlaceId: 'offline:istanbul:ayasofya', name: 'Ayasofya', city: 'istanbul', lat: 41.0086, lng: 28.9802, address: 'Sultan Ahmet, Fatih', rating: 4.8, types: ['tourist_attraction', 'place_of_worship'], category: 'landmark', estimatedCost: 25, durationHours: 1.5 },
  { googlePlaceId: 'offline:istanbul:topkapi', name: 'Topkapı Sarayı', city: 'istanbul', lat: 41.0115, lng: 28.9833, address: 'Cankurtaran, Fatih', rating: 4.7, types: ['museum', 'tourist_attraction'], category: 'museum', estimatedCost: 30, durationHours: 2.5 },
  { googlePlaceId: 'offline:istanbul:kapalicarsi', name: 'Kapalıçarşı', city: 'istanbul', lat: 41.0108, lng: 28.968, address: 'Beyazıt, Fatih', rating: 4.5, types: ['shopping_mall', 'tourist_attraction'], category: 'shopping', estimatedCost: 0, durationHours: 1.5 },
  { googlePlaceId: 'offline:istanbul:galata', name: 'Galata Kulesi', city: 'istanbul', lat: 41.0256, lng: 28.9741, address: 'Bereketzade, Beyoğlu', rating: 4.7, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 20, durationHours: 1 },
  { googlePlaceId: 'offline:istanbul:kadikoy', name: 'Kadıköy Pazarı', city: 'istanbul', lat: 40.9901, lng: 29.027, address: 'Caferağa, Kadıköy', rating: 4.6, types: ['market', 'food'], category: 'food', estimatedCost: 18, durationHours: 2 },
  { googlePlaceId: 'offline:istanbul:gulhane', name: 'Gülhane Parkı', city: 'istanbul', lat: 41.0128, lng: 28.9813, address: 'Cankurtaran, Fatih', rating: 4.6, types: ['park'], category: 'nature', estimatedCost: 0, durationHours: 1.5 },

  // Paris
  { googlePlaceId: 'offline:paris:louvre', name: 'Louvre Müzesi', city: 'paris', lat: 48.8606, lng: 2.3376, address: 'Rue de Rivoli', rating: 4.8, types: ['museum'], category: 'museum', estimatedCost: 22, durationHours: 3 },
  { googlePlaceId: 'offline:paris:eiffel', name: 'Eyfel Kulesi', city: 'paris', lat: 48.8584, lng: 2.2945, address: 'Champ de Mars', rating: 4.7, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 29, durationHours: 2 },
  { googlePlaceId: 'offline:paris:montmartre', name: 'Montmartre', city: 'paris', lat: 48.8867, lng: 2.3431, address: '18. arrondissement', rating: 4.7, types: ['neighborhood'], category: 'landmark', estimatedCost: 0, durationHours: 2 },
  { googlePlaceId: 'offline:paris:latin', name: 'Latin Quarter Yemek Turu', city: 'paris', lat: 48.8496, lng: 2.347, address: 'Quartier latin', rating: 4.6, types: ['food'], category: 'food', estimatedCost: 35, durationHours: 2 },
  { googlePlaceId: 'offline:paris:luxembourg', name: 'Luxembourg Bahçeleri', city: 'paris', lat: 48.8462, lng: 2.3372, address: '6. arrondissement', rating: 4.8, types: ['park'], category: 'nature', estimatedCost: 0, durationHours: 1.5 },
  { googlePlaceId: 'offline:paris:galeries', name: 'Galeries Lafayette', city: 'paris', lat: 48.8738, lng: 2.3326, address: 'Boulevard Haussmann', rating: 4.5, types: ['shopping_mall'], category: 'shopping', estimatedCost: 0, durationHours: 1.5 },

  // Roma
  { googlePlaceId: 'offline:rome:colosseum', name: 'Kolezyum', city: 'roma', lat: 41.8902, lng: 12.4922, address: 'Piazza del Colosseo', rating: 4.8, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 18, durationHours: 2 },
  { googlePlaceId: 'offline:rome:vatican', name: 'Vatikan Müzeleri', city: 'roma', lat: 41.9065, lng: 12.4536, address: 'Viale Vaticano', rating: 4.7, types: ['museum'], category: 'museum', estimatedCost: 25, durationHours: 3 },
  { googlePlaceId: 'offline:rome:trevi', name: 'Trevi Çeşmesi', city: 'roma', lat: 41.9009, lng: 12.4833, address: 'Piazza di Trevi', rating: 4.8, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 0, durationHours: 1 },
  { googlePlaceId: 'offline:rome:trastevere', name: 'Trastevere Akşam Yemeği', city: 'roma', lat: 41.889, lng: 12.469, address: 'Trastevere', rating: 4.7, types: ['food'], category: 'food', estimatedCost: 32, durationHours: 2 },
  { googlePlaceId: 'offline:rome:borghese', name: 'Villa Borghese', city: 'roma', lat: 41.9142, lng: 12.4923, address: 'Piazzale Napoleone I', rating: 4.7, types: ['park'], category: 'nature', estimatedCost: 0, durationHours: 2 },
  { googlePlaceId: 'offline:rome:campo', name: "Campo de' Fiori Pazarı", city: 'roma', lat: 41.8955, lng: 12.4722, address: "Piazza Campo de' Fiori", rating: 4.5, types: ['market'], category: 'shopping', estimatedCost: 10, durationHours: 1 },

  // Barselona
  { googlePlaceId: 'offline:barcelona:sagrada', name: 'Sagrada Família', city: 'barselona', lat: 41.4036, lng: 2.1744, address: 'Carrer de Mallorca', rating: 4.8, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 26, durationHours: 2 },
  { googlePlaceId: 'offline:barcelona:guell', name: 'Park Güell', city: 'barselona', lat: 41.4145, lng: 2.1527, address: 'Gràcia', rating: 4.6, types: ['park'], category: 'nature', estimatedCost: 10, durationHours: 2 },
  { googlePlaceId: 'offline:barcelona:gothic', name: 'Gotik Mahalle', city: 'barselona', lat: 41.3839, lng: 2.1762, address: 'Ciutat Vella', rating: 4.7, types: ['neighborhood'], category: 'landmark', estimatedCost: 0, durationHours: 2 },
  { googlePlaceId: 'offline:barcelona:boqueria', name: 'La Boqueria Pazarı', city: 'barselona', lat: 41.3818, lng: 2.1715, address: 'La Rambla', rating: 4.6, types: ['market', 'food'], category: 'food', estimatedCost: 15, durationHours: 1.5 },
  { googlePlaceId: 'offline:barcelona:batllo', name: 'Casa Batlló', city: 'barselona', lat: 41.3917, lng: 2.1649, address: 'Passeig de Gràcia', rating: 4.7, types: ['museum'], category: 'museum', estimatedCost: 29, durationHours: 1.5 },
  { googlePlaceId: 'offline:barcelona:barceloneta', name: 'Barceloneta Plajı', city: 'barselona', lat: 41.3784, lng: 2.1925, address: 'Barceloneta', rating: 4.5, types: ['beach'], category: 'nature', estimatedCost: 0, durationHours: 2 },

  // Londra
  { googlePlaceId: 'offline:london:british', name: 'British Museum', city: 'londra', lat: 51.5194, lng: -0.127, address: 'Great Russell Street', rating: 4.8, types: ['museum'], category: 'museum', estimatedCost: 0, durationHours: 3 },
  { googlePlaceId: 'offline:london:tower', name: 'Tower of London', city: 'londra', lat: 51.5081, lng: -0.0759, address: 'Tower Hill', rating: 4.7, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 33, durationHours: 2.5 },
  { googlePlaceId: 'offline:london:borough', name: 'Borough Market', city: 'londra', lat: 51.5055, lng: -0.091, address: 'Southwark', rating: 4.7, types: ['market', 'food'], category: 'food', estimatedCost: 20, durationHours: 1.5 },
  { googlePlaceId: 'offline:london:hyde', name: 'Hyde Park', city: 'londra', lat: 51.5073, lng: -0.1657, address: 'Westminster', rating: 4.8, types: ['park'], category: 'nature', estimatedCost: 0, durationHours: 2 },
  { googlePlaceId: 'offline:london:camden', name: 'Camden Market', city: 'londra', lat: 51.5416, lng: -0.146, address: 'Camden Lock Place', rating: 4.6, types: ['market', 'shopping_mall'], category: 'shopping', estimatedCost: 12, durationHours: 2 },
  { googlePlaceId: 'offline:london:eye', name: 'London Eye', city: 'londra', lat: 51.5033, lng: -0.1196, address: 'Riverside Building', rating: 4.5, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 35, durationHours: 1.5 },

  // Amsterdam
  { googlePlaceId: 'offline:amsterdam:rijks', name: 'Rijksmuseum', city: 'amsterdam', lat: 52.36, lng: 4.8852, address: 'Museumstraat 1', rating: 4.8, types: ['museum'], category: 'museum', estimatedCost: 22, durationHours: 2.5 },
  { googlePlaceId: 'offline:amsterdam:annefrank', name: 'Anne Frank Evi', city: 'amsterdam', lat: 52.3752, lng: 4.884, address: 'Prinsengracht 263', rating: 4.7, types: ['museum'], category: 'museum', estimatedCost: 16, durationHours: 1.5 },
  { googlePlaceId: 'offline:amsterdam:jordaan', name: 'Jordaan Mahallesi', city: 'amsterdam', lat: 52.3764, lng: 4.8816, address: 'Jordaan', rating: 4.7, types: ['neighborhood'], category: 'landmark', estimatedCost: 0, durationHours: 2 },
  { googlePlaceId: 'offline:amsterdam:vondel', name: 'Vondelpark', city: 'amsterdam', lat: 52.3579, lng: 4.8686, address: 'Vondelpark', rating: 4.8, types: ['park'], category: 'nature', estimatedCost: 0, durationHours: 1.5 },
  { googlePlaceId: 'offline:amsterdam:albert', name: 'Albert Cuyp Pazarı', city: 'amsterdam', lat: 52.3559, lng: 4.8946, address: 'Albert Cuypstraat', rating: 4.6, types: ['market', 'food'], category: 'food', estimatedCost: 12, durationHours: 1.5 },
  { googlePlaceId: 'offline:amsterdam:cruise', name: 'Kanal Turu', city: 'amsterdam', lat: 52.3676, lng: 4.9041, address: 'Centraal Station', rating: 4.7, types: ['tourist_attraction'], category: 'landmark', estimatedCost: 20, durationHours: 1.5 },
]

const CITY_ALIASES: Record<string, string> = {
  istanbul: 'istanbul',
  'i̇stanbul': 'istanbul',
  paris: 'paris',
  roma: 'roma',
  rome: 'roma',
  barselona: 'barselona',
  barcelona: 'barselona',
  londra: 'londra',
  london: 'londra',
  amsterdam: 'amsterdam',
}

export function normalizeCity(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replaceAll('â', 'a')
}

export function findCandidates(destination: string): PlaceCandidate[] {
  const city = CITY_ALIASES[normalizeCity(destination)]
  if (!city) return []
  return PLACES.filter((place) => place.city === city)
}

export function searchCatalog(query: string, destination?: string): PlaceCandidate[] {
  const needle = normalizeCity(query)
  const pool = destination ? findCandidates(destination) : PLACES
  if (!needle) return pool.slice(0, 12)
  return pool
    .filter((place) => normalizeCity(`${place.name} ${place.address} ${place.city}`).includes(needle))
    .slice(0, 20)
}

export function cityLabel(destination: string): string {
  const city = CITY_ALIASES[normalizeCity(destination)]
  if (!city) return destination
  return city.charAt(0).toLocaleUpperCase('tr-TR') + city.slice(1)
}
