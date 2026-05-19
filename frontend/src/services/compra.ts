import apiClient from './api'

export interface DetalleCompra {
  id: number
  productoId: number
  cantidad: number
  costoUnitario: number
  subtotal: number
  producto?: { nombre: string }
}

export interface Compra {
  id: number
  fecha: string
  total: number
  estado: string
  proveedorId?: number
  usuarioId: number
  proveedor?: { nombre: string }
  usuario?: { nombre: string; apellido: string }
  detalles?: DetalleCompra[]
}

export interface CreateCompraRequest {
  proveedorId?: number
  detalles: Array<{
    productoId: number
    cantidad: number
    costoUnitario: number
  }>
}

export const compraService = {
  getAll: async (page = 1, limit = 20): Promise<Compra[]> => {
    const { data } = await apiClient.get<Compra[]>('/compra', {
      params: { page, limit },
    })
    return data
  },

  getById: async (id: number): Promise<Compra> => {
    const { data } = await apiClient.get<Compra>(`/compra/${id}`)
    return data
  },

  create: async (compra: CreateCompraRequest): Promise<Compra> => {
    const payload = {
      proveedorId: compra.proveedorId,
      detalles: compra.detalles.map(({ productoId, cantidad, costoUnitario }) => ({
        productoId,
        cantidad,
        costoUnitario,
      })),
    }
    const { data } = await apiClient.post<Compra>('/compra', payload)
    return data
  },

  anular: async (id: number): Promise<Compra> => {
    const { data } = await apiClient.patch<Compra>(`/compra/${id}/anular`)
    return data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/compra/${id}`)
  },
}
