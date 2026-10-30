const INTEREST_ALIASES: Record<string, string> = {
  'müze': 'museum',
  muze: 'museum',
  museum: 'museum',
  'yemek': 'food',
  food: 'food',
  'doğa': 'nature',
  doga: 'nature',
  nature: 'nature',
  'gece': 'nightlife',
  nightlife: 'nightlife',
  'tarih': 'history',
  history: 'history',
  'alışveriş': 'shopping',
  alisveris: 'shopping',
  shopping: 'shopping',
  'gezilecek yer': 'landmark',
  landmark: 'landmark',
}

export const INTEREST_LABELS: Record<string, string> = {
  museum: 'Müze',
  food: 'Yemek',
  nature: 'Doğa',
  nightlife: 'Gece',
  history: 'Tarih',
  shopping: 'Alışveriş',
  landmark: 'Gezilecek yer',
}

export function canonicalInterest(input: string): string {
  const key = input.trim().toLocaleLowerCase('tr-TR')
  return INTEREST_ALIASES[key] ?? key
}

export function interestLabel(input: string): string {
  const canonical = canonicalInterest(input)
  return INTEREST_LABELS[canonical] ?? input
}
