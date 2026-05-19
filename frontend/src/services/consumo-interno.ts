import apiClient from './api'

export interface ConsumoInterno {
  id: number
  fecha: string
  motivo: string
  usuarioId: number
  usuario?: { nombre: string; apellido: string }
  detalles?: Array<{
    id: number
    cantidad: number
    productoId: number
    producto: { nombre: string; precio: number }
  }>
}

export interface CreateConsumoRequest {
  motivo: string
  detalles: Array<{
    productoId: number
    cantidad: number
  }>
}

export const consumoInternoService = {
  getAll: async (): Promise<ConsumoInterno[]> => {
    const { data } = await apiClient.get<ConsumoInterno[]>('/consumo-interno')
    return data
  },

  getById: async (id: number): Promise<ConsumoInterno> => {
    const { data } = await apiClient.get<ConsumoInterno>(`/consumo-interno/${id}`)
    return data
  },

  create: async (consumo: CreateConsumoRequest): Promise<ConsumoInterno> => {
    const { data } = await apiClient.post<ConsumoInterno>('/consumo-interno', consumo)
    return data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/consumo-interno/${id}`)
  },
}
