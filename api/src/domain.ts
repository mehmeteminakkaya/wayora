export const ACTIVITY_CATEGORIES = [
  'museum',
  'food',
  'nature',
  'landmark',
  'shopping',
  'other',
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

export const BUDGET_LEVELS = ['low', 'mid', 'high'] as const
export type BudgetLevel = (typeof BUDGET_LEVELS)[number]

export const TRAVEL_STYLES = ['relaxed', 'balanced', 'packed'] as const
export type TravelStyle = (typeof TRAVEL_STYLES)[number]

export const PACES = ['slow', 'moderate', 'fast'] as const
export type Pace = (typeof PACES)[number]

export const TRIP_STATUSES = ['draft', 'generating', 'planned', 'failed'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]
