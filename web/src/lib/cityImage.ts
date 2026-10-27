export function cityImage(destination: string): string {
  const value = destination.toLocaleLowerCase('tr-TR')
  if (value.includes('istanbul') || value.includes('i̇stanbul')) return '/images/istanbul.jpg'
  if (value.includes('roma') || value.includes('rome')) return '/images/rome.jpg'
  if (value.includes('londra') || value.includes('london')) return '/images/london.jpg'
  return '/images/paris.jpg'
}
