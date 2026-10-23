import { api } from './client'

export type User = { id: string; email: string; name: string | null }

export type RegisterInput = { email: string; password: string; name?: string }

export const register = (input: RegisterInput) =>
  api<{ user: User }>('/api/auth/register', { method: 'POST', body: input })
