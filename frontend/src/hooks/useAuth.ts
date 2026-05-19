import { create } from 'zustand'
import type { AuthUser, Role } from '@shared/types/auth'

const normalizeRole = (role?: string): Role => {
  const normalized = String(role || '').toUpperCase()

  if (normalized === 'SUPERADMIN') return 'SUPERADMIN'
  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'BODEGA') return 'BODEGA'
  return 'VENDEDOR'
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: Partial<AuthUser> & { role?: string }) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) return null

    try {
      return JSON.parse(rawUser) as AuthUser
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  setUser: (user) => {
    // Normalizar el usuario para asegurar que tiene la estructura correcta
    const normalizedUser: AuthUser = {
      id: Number(user.id),
      email: user.email || '',
      nombre: user.nombre || '',
      apellido: user.apellido,
      rol: normalizeRole(user.rol || user.role),
    }
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    set({ user: normalizedUser })
  },
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
