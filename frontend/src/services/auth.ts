import apiClient from './api'
import type { AuthUser } from '@shared/types/auth'

export interface AuthLoginResponse {
  access_token: string
  user?: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await apiClient.post<AuthLoginResponse>('/auth/login', credentials)
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  async getProfile(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>('/auth/profile')
    return data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    })
    return data
  },

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),
}
