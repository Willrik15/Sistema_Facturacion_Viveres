import apiClient from './api'

export interface Producto {
  id: number
  nombre: string
  categoria?: string
  margenGanancia?: number
  precio: number
  stock: number
  stockMinimo: number
  codigoBarras?: string
  proveedorId?: number
}

export interface ProductoResponse {
  data: Producto[]
  meta: {
    total: number
    page: number
    lastPage: number
  }
}

export const productoService = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const { data } = await apiClient.get<ProductoResponse>('/producto', {
      params: { page, limit, search },
    })
    return data
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<Producto>(`/producto/${id}`)
    return data
  },

  create: async (producto: Omit<Producto, 'id'>) => {
    const { data } = await apiClient.post<Producto>('/producto', producto)
    return data
  },

  update: async (id: number, producto: Partial<Producto>) => {
    const { data } = await apiClient.put<Producto>(`/producto/${id}`, producto)
    return data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/producto/${id}`)
  },

  buscarPorCodigo: async (codigo: string) => {
    const { data } = await apiClient.get<Producto>(`/producto/scan/${codigo}`)
    return data
  },
}
