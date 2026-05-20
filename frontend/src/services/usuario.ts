import apiClient from './api'

export type RolUsuario = 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'BODEGA'

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  activo: boolean
  rol: RolUsuario
}

export interface CreateUsuarioRequest {
  nombre: string
  apellido: string
  email: string
  password: string
  rol?: RolUsuario
}

export interface UpdateUsuarioRequest {
  nombre?: string
  apellido?: string
  email?: string
  password?: string
  rol?: RolUsuario
  activo?: boolean
}

export const usuarioService = {
  getAll: async (): Promise<Usuario[]> => {
    const { data } = await apiClient.get<Usuario[]>('/usuarios')
    return data
  },

  getById: async (id: number): Promise<Usuario> => {
    const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`)
    return data
  },

  create: async (usuario: CreateUsuarioRequest): Promise<Usuario> => {
    const { data } = await apiClient.post<Usuario>('/usuarios', usuario)
    return data
  },

  update: async (id: number, usuario: UpdateUsuarioRequest): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(`/usuarios/${id}`, usuario)
    return data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/usuarios/${id}`)
  },

  reactivate: async (id: number): Promise<Usuario> => {
    const { data } = await apiClient.put<Usuario>(`/usuarios/${id}`, { activo: true })
    return data
  },
}
