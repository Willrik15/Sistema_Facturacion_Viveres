import apiClient from './api'

export interface FacturaVenta {
  id: number
  numero: string
  claveAcceso: string
  estadoSRI: string
  fechaAutorizacion?: string | null
}

export interface DetalleVentaItem {
  id: number
  cantidad: number
  subtotal: number
  producto: {
    id: number
    nombre: string
    precio: number
  }
}

export interface Venta {
  id: number
  fecha: string
  total: number
  clienteId: number
  usuarioId: number
  estado: 'ACTIVA' | 'ANULADA'
  cliente?: {
    id: number
    nombre: string
    cedula: string
    tipoIdentificacion: string
    direccion?: string | null
    email?: string | null
    telefono?: string | null
  }
  factura?: FacturaVenta | null
  detalles?: DetalleVentaItem[]
}

export interface CreateVentaRequest {
  clienteId: number
  detalles: Array<{
    productoId: number
    cantidad: number
  }>
}

export const ventaService = {
  getAll: async () => {
    const { data } = await apiClient.get<Venta[]>('/ventas')
    return data
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<Venta>(`/ventas/${id}`)
    return data
  },

  create: async (venta: CreateVentaRequest): Promise<Venta> => {
    const payload: CreateVentaRequest = {
      clienteId: venta.clienteId,
      detalles: venta.detalles.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
    }
    const { data } = await apiClient.post<Venta>('/ventas', payload)
    return data
  },

  anular: async (id: number) => {
    const { data } = await apiClient.delete<Venta>(`/ventas/${id}`)
    return data
  },

  reporte: async (fechaDesde?: string, fechaHasta?: string) => {
    const { data } = await apiClient.get('/ventas/reporte', {
      params: { fechaDesde, fechaHasta },
    })
    return data
  },
}
