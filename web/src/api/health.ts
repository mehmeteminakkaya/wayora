import { api } from './client'

export type Health = { status: 'ok'; db: 'ok' | 'error' }

export const getHealth = () => api<Health>('/api/health')
