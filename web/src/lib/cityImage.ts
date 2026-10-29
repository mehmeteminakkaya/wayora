export function cityImage(destination: string): string | null {
  const value = destination
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('̇', '')
    .trim()

  if (value.includes('istanbul')) return '/images/istanbul.jpg'
  if (value.includes('paris')) return '/images/paris.jpg'
  if (value.includes('roma') || value.includes('rome')) return '/images/rome.jpg'
  if (value.includes('londra') || value.includes('london')) return '/images/london.jpg'
  return null
}

export function cityInitials(destination: string): string {
  return destination
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('')
}
