import apiClient from './api'

export interface KardexMovimiento {
  id: number
  fecha: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  saldo: number
  costoUnitario: number
  costoTotal: number
  referencia?: string | null
  refId?: number | null
  producto: {
    id: number
    nombre: string
    codigoBarras?: string | null
    stockMinimo?: number
    stock?: number
  }
}

export const kardexService = {
  getAll: async (): Promise<KardexMovimiento[]> => {
    const { data } = await apiClient.get<KardexMovimiento[]>('/inventario-movimiento')
    return data
  },

  getByProducto: async (productoId: number): Promise<KardexMovimiento[]> => {
    const { data } = await apiClient.get<KardexMovimiento[]>(
      `/inventario-movimiento/producto?productoId=${productoId}`,
    )
    return data
  },

  crearAjuste: async (payload: {
    productoId: number
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
    cantidad: number
    motivo: string
  }): Promise<KardexMovimiento> => {
    const { data } = await apiClient.post<KardexMovimiento>('/inventario-movimiento/ajuste', payload)
    return data
  },
}
