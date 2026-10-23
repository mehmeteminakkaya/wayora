import { api, ApiError } from './client'

export type User = { id: string; email: string; name: string | null }

export type RegisterInput = { email: string; password: string; name?: string }
export type LoginInput = { email: string; password: string }

export const register = (input: RegisterInput) =>
  api<{ user: User }>('/api/auth/register', { method: 'POST', body: input })

export const login = (input: LoginInput) =>
  api<{ user: User }>('/api/auth/login', { method: 'POST', body: input })

export const logout = () => api<void>('/api/auth/logout', { method: 'POST' })

// Oturum yoksa hata yerine null döner
export async function getMe(): Promise<User | null> {
  try {
    return (await api<{ user: User }>('/api/auth/me')).user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}
