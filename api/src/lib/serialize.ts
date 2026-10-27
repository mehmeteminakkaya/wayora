// Prisma Decimal ve Date değerlerini JSON'a güvenli biçimde çevirir.
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value.toString())
  return Number.isFinite(parsed) ? parsed : null
}

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10)
}
