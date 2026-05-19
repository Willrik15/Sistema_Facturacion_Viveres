import apiClient from './api'

export interface Proveedor {
  id: number
  nombre: string
  ruc?: string
  telefono?: string
  direccion?: string
}

export const proveedorService = {
  getAll: async (): Promise<Proveedor[]> => {
    const { data } = await apiClient.get<any>('/proveedores', {
      params: { page: 1, limit: 100 },
    })
    return Array.isArray(data) ? data : data.data ?? []
  },

  create: async (body: { nombre: string; ruc: string; telefono: string }): Promise<Proveedor> => {
    const { data } = await apiClient.post<Proveedor>('/proveedores', body)
    return data
  },
}
