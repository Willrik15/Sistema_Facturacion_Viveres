import apiClient from './api'

export interface DetalleFio {
  id: number
  productoId: number
  cantidad: number
  precio: number
  subtotal: number
  producto?: { nombre: string }
}

export interface PagoFio {
  id: number
  monto: number
  fecha: string
}

export interface Fio {
  id: number
  fecha: string
  total: number
  saldo: number        // calculado: total - sum(pagos.monto)
  estado: 'PENDIENTE' | 'PAGADO' | 'PARCIAL'
  clienteId: number
  cliente?: { nombre: string; cedula?: string }
  detalles?: DetalleFio[]
  pagos?: PagoFio[]
}

export interface CreateFioRequest {
  clienteId: number
  detalles: Array<{
    productoId: number
    cantidad: number
    precio: number
  }>
}

const calcularSaldo = (fio: any): Fio => {
  const totalPagado = (fio.pagos ?? []).reduce((s: number, p: PagoFio) => s + Number(p.monto), 0)
  return { ...fio, saldo: Number(fio.total) - totalPagado }
}

export const fioService = {
  getAll: async (page = 1, limit = 20): Promise<Fio[]> => {
    const { data } = await apiClient.get<any>('/fio', {
      params: { page, limit },
    })
    const lista: any[] = Array.isArray(data) ? data : data.data ?? []
    return lista.map(calcularSaldo)
  },

  getById: async (id: number): Promise<Fio> => {
    const { data } = await apiClient.get<any>(`/fio/${id}`)
    return calcularSaldo(data)
  },

  create: async (fio: CreateFioRequest): Promise<Fio> => {
    const payload = {
      clienteId: fio.clienteId,
      detalles: fio.detalles.map(({ productoId, cantidad, precio }) => ({
        productoId,
        cantidad,
        precio,
      })),
    }
    const { data } = await apiClient.post<Fio>('/fio', payload)
    return data
  },

  pagar: async (fioId: number, monto: number, emitirFactura?: boolean): Promise<void> => {
    await apiClient.post('/fio/pago', { fioId, monto, emitirFactura: emitirFactura ?? false })
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/fio/${id}`)
  },
}
