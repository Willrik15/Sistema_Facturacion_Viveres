import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, RefreshCw } from 'lucide-react'
import { Loading } from '@/components/Loading'
import { ventaService } from '@/services/venta'
import { productoService } from '@/services/producto'
import { fioService } from '@/services/fio'
import { reportesService } from '@/services/reportes'
import { useAuthStore } from '@/hooks/useAuth'

interface Stats {
  totalVentas: number
  totalInventario: number
  productosBajoStock: number
  deudaPendiente: number
}

interface VentaReciente {
  id: number
  numeroFactura: string
  cliente: string
  total: number
  fecha: string
}

interface TopProducto {
  nombre: string
  cantidad: number
}

type PeriodoResumen = 'dia' | 'semana' | 'mes'

interface ResumenFinanciero {
  ingresos: number
  egresos: number
  neto: number
}

export function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<Stats>({
    totalVentas: 0,
    totalInventario: 0,
    productosBajoStock: 0,
    deudaPendiente: 0,
  })
  const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoResumen, setPeriodoResumen] = useState<PeriodoResumen>('dia')
  const [resumen, setResumen] = useState<ResumenFinanciero>({ ingresos: 0, egresos: 0, neto: 0 })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    calcularResumen(periodoResumen)
  }, [periodoResumen])

  const calcularResumen = async (periodo: PeriodoResumen) => {
    try {
      const ahora = new Date()
      let desde: Date
      if (periodo === 'dia') {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      } else if (periodo === 'semana') {
        const dow = ahora.getDay()
        desde = new Date(ahora)
        desde.setDate(ahora.getDate() - dow)
        desde.setHours(0, 0, 0, 0)
      } else {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      }

      const fechaDesde = desde.toISOString().split('T')[0]
      const fechaHasta = ahora.toISOString().split('T')[0]
      const flujo = await reportesService.getDashboardResumen({ fechaDesde, fechaHasta })

      setResumen({
        ingresos: flujo.ingresos || 0,
        egresos: flujo.egresos || 0,
        neto: flujo.neto || 0,
      })
    } catch {
      // silencioso
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar ventas
      const ventasResponse = await ventaService.getAll()
      const ventasData = Array.isArray(ventasResponse) ? ventasResponse : []
      
      // Calcular stats de ventas
      const totalVentas = ventasData.reduce((sum: number, venta: any) => sum + (venta.total || 0), 0)
      
      // Preparar ventas recientes (últimas 3)
      const recientes = ventasData.slice(0, 3).map((v: any) => ({
        id: v.id,
        numeroFactura: v.factura?.numero || `FAC-${String(v.id).padStart(9, '0')}`,
        cliente: v.cliente?.nombre || 'Cliente sin registrar',
        total: v.total || 0,
        fecha: new Date(v.fecha).toLocaleString('es-EC'),
      }))

      // Top 5 productos más vendidos
      const conteo: Record<string, number> = {}
      for (const venta of ventasData) {
        for (const d of (venta as any).detalles ?? []) {
          const nombre = d.producto?.nombre ?? `Producto #${d.productoId}`
          conteo[nombre] = (conteo[nombre] ?? 0) + d.cantidad
        }
      }
      const top5 = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      setTopProductos(top5)

      // Cargar productos
      const productosResponse = await productoService.getAll(1, 1000, '')
      const productosData = productosResponse?.data || []
      
      // Contar bajo stock
      const productosBajo = productosData.filter((p: any) => p.stock < p.stockMinimo).length

      // Deudas pendientes (FIOs)
      const fios = await fioService.getAll(1, 1000)
      const deudaPendiente = fios
        .filter((f) => f.estado === 'PENDIENTE' || f.estado === 'PARCIAL')
        .reduce((s, f) => s + f.saldo, 0)

      setStats({
        totalVentas,
        totalInventario: productosData.length,
        productosBajoStock: productosBajo,
        deudaPendiente,
      })

      setVentasRecientes(recientes)
      await calcularResumen(periodoResumen)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading message="Cargando dashboard..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.nombre || 'Usuario'}
          </h1>
          <p className="text-gray-600 mt-1">Resumen de tu negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Ventas del Mes"
            value={`$${stats.totalVentas.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
            bgColor="bg-primary-50"
            iconColor="text-primary-600"
            trend="+12%"
          />
          <StatCard
            icon={Package}
            label="Productos en Inventario"
            value={stats.totalInventario.toString()}
            bgColor="bg-success-50"
            iconColor="text-success-600"
            trend="Actualizado"
          />
          <StatCard
            icon={AlertCircle}
            label="Bajo Stock"
            value={stats.productosBajoStock.toString()}
            bgColor="bg-warning-50"
            iconColor="text-warning-600"
            trend="⚠️ Revisar"
          />
          <StatCard
            icon={TrendingUp}
            label="Deuda Pendiente"
            value={`$${stats.deudaPendiente.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
            bgColor="bg-danger-50"
            iconColor="text-danger-600"
            trend="Por cobrar"
          />
        </div>

        {/* Resumen financiero por período */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Resumen Financiero</h3>
              <p className="text-xs text-gray-500">Ingresos, egresos y ganancia neta</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['dia', 'semana', 'mes'] as PeriodoResumen[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodoResumen(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    periodoResumen === p
                      ? 'bg-white shadow text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-700 font-medium mb-1">Ingresos</p>
              <p className="text-xl font-bold text-green-800">
                ${resumen.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={12} className="text-green-600" />
                <span className="text-xs text-green-600">Ventas activas</span>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-700 font-medium mb-1">Egresos</p>
              <p className="text-xl font-bold text-red-800">
                ${resumen.egresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={12} className="text-red-600" />
                <span className="text-xs text-red-600">Compras activas</span>
              </div>
            </div>
            <div className={`rounded-xl p-4 ${resumen.neto >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-xs font-medium mb-1 ${resumen.neto >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                Neto
              </p>
              <p className={`text-xl font-bold ${resumen.neto >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                ${resumen.neto.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <RefreshCw size={12} className={resumen.neto >= 0 ? 'text-blue-600' : 'text-orange-600'} />
                <span className={`text-xs ${resumen.neto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {resumen.neto >= 0 ? 'Ganancia' : 'Pérdida'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Ventas Recientes" subtitle={`${ventasRecientes.length} últimas transacciones`}>
            <div className="space-y-4">
              {ventasRecientes.length > 0 ? (
                ventasRecientes.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{venta.cliente}</p>
                      <p className="text-xs text-gray-500">{venta.numeroFactura}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${venta.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{venta.fecha}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay ventas registradas</p>
              )}
            </div>
          </Card>

          <Card title="Productos Populares" subtitle="Top 5 más vendidos (por unidades)">
            <div className="space-y-4">
              {topProductos.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">Sin ventas registradas aún</p>
              ) : (() => {
                const maxCant = topProductos[0]?.cantidad || 1
                return topProductos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <p className="text-gray-900 font-medium text-sm truncate flex-1">{p.nombre}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.round((p.cantidad / maxCant) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right font-semibold">
                        {p.cantidad}
                      </span>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-primary-600">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Tips</h3>
            <p className="text-sm text-gray-600">
              Usa el chatbot para búsquedas rápidas de productos y consultas de deudas.
            </p>
          </Card>
          <Card className="border-l-4 border-warning-600">
            <h3 className="font-semibold text-gray-900 mb-2">⚠️ Atención</h3>
            <p className="text-sm text-gray-600">
              Hay {stats.productosBajoStock} productos con stock bajo. Revisa el inventario.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

interface StatCardProps {
  icon: React.ElementType<any>
  label: string
  value: string | number
  bgColor: string
  iconColor: string
  trend?: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`${bgColor} p-4 rounded-lg`}>
        <Icon size={24} className={iconColor} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
    </Card>
  )
}
