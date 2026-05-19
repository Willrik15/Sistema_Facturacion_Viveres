import apiClient from './api'
import type {
  ClienteMasFrecuente,
  FlujoCaja,
  GananciaDiaria,
  GananciaProducto,
  LibroDiarioItem,
  ProductoMasVendido,
  ResumenPeriodo,
} from '@shared/types/reportes'

interface FiltrosReporte {
  fechaDesde?: string
  fechaHasta?: string
  periodo?: 'diario' | 'mensual' | 'anual'
  limite?: number
}

const construirQuery = (filtros: FiltrosReporte = {}) => {
  const parametros = new URLSearchParams()

  if (filtros.fechaDesde) parametros.append('fechaDesde', filtros.fechaDesde)
  if (filtros.fechaHasta) parametros.append('fechaHasta', filtros.fechaHasta)
  if (filtros.periodo) parametros.append('periodo', filtros.periodo)
  if (typeof filtros.limite === 'number') parametros.append('limite', String(filtros.limite))

  return parametros
}

export const reportesService = {
  async getDashboardResumen(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<FlujoCaja | any>(`/reportes/dashboard-resumen?${construirQuery(filtros)}`)

    return {
      ingresos: Number(data?.ingresos || 0),
      egresos: Number(data?.egresos || 0),
      neto: Number(data?.neto || 0),
      margen: Number(data?.margen ?? data?.margenNeto ?? 0),
    } as FlujoCaja
  },

  async getLibroDiario(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<LibroDiarioItem[]>(`/reportes/libro-diario?${construirQuery(filtros)}`)
    return data
  },

  async getResumenVentas(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<ResumenPeriodo[] | any>(`/reportes/resumen-ventas?${construirQuery(filtros)}`)

    if (Array.isArray(data)) return data

    return [
      {
        periodo: data?.periodo || 'Total',
        totalIngresos: Number(data?.totalIngresos || 0),
        totalEgresos: Number(data?.totalEgresos || 0),
        neto: Number(data?.neto || data?.totalIngresos || 0),
        transacciones: Number(data?.transacciones || data?.totalVentas || 0),
      },
    ]
  },

  async getResumenCompras(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<ResumenPeriodo[] | any>(`/reportes/resumen-compras?${construirQuery(filtros)}`)

    if (Array.isArray(data)) return data

    return [
      {
        periodo: data?.periodo || 'Total',
        totalIngresos: Number(data?.totalIngresos || 0),
        totalEgresos: Number(data?.totalEgresos || 0),
        neto: Number(data?.neto || -(data?.totalEgresos || 0)),
        transacciones: Number(data?.transacciones || data?.totalCompras || 0),
      },
    ]
  },

  async getFlujoCaja(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<FlujoCaja | any>(`/reportes/flujo-caja?${construirQuery(filtros)}`)

    return {
      ingresos: Number(data?.ingresos || 0),
      egresos: Number(data?.egresos || 0),
      neto: Number(data?.neto || 0),
      margen: Number(data?.margen ?? data?.margenNeto ?? 0),
    } as FlujoCaja
  },

  async getProductosMasVendidos(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<ProductoMasVendido[]>(
      `/reportes/productos-mas-vendidos?${construirQuery(filtros)}`,
    )
    return data
  },

  async getClientesMasFrecuentes(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<ClienteMasFrecuente[] | any[]>(
      `/reportes/clientes-mas-frecuentes?${construirQuery(filtros)}`,
    )

    return (Array.isArray(data) ? data : []).map((item, idx) => ({
      id: Number(item.id ?? idx + 1),
      nombre: item.nombre || 'Sin nombre',
      transacciones: Number(item.transacciones ?? item.compras ?? 0),
      totalComprado: Number(item.totalComprado ?? item.totalGastado ?? 0),
      porcentaje: Number(item.porcentaje ?? 0),
    }))
  },

  async getGananciaPorProducto(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<GananciaProducto[]>(
      `/reportes/ganancia-por-producto?${construirQuery(filtros)}`,
    )
    return data
  },

  async getGananciaDiaria(filtros: FiltrosReporte = {}) {
    const { data } = await apiClient.get<GananciaDiaria[]>(
      `/reportes/ganancia-diaria?${construirQuery(filtros)}`,
    )
    return data
  },
}
