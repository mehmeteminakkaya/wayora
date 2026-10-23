import { api } from './client'

export type BudgetLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Pace = 'RELAXED' | 'BALANCED' | 'PACKED'
export type TravelStyle = 'SOLO' | 'COUPLE' | 'FAMILY' | 'FRIENDS'

export type Preferences = {
  interests: string[]
  budgetLevel: BudgetLevel
  pace: Pace
  travelStyle: TravelStyle | null
}

export const getPreferences = () =>
  api<{ preferences: Preferences | null }>('/api/me/preferences').then((r) => r.preferences)

export const savePreferences = (input: Preferences) =>
  api<{ preferences: Preferences }>('/api/me/preferences', { method: 'PUT', body: input }).then(
    (r) => r.preferences,
  )
