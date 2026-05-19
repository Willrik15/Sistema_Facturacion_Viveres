import { useState, useEffect } from 'react'
import { AlertCircle, BarChart3, Calendar, Eye, X } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { reportesService } from '@/services/reportes'
import type {
  ClienteMasFrecuente,
  FlujoCaja,
  GananciaDiaria,
  GananciaProducto,
  LibroDiarioItem,
  ProductoMasVendido,
  ResumenPeriodo,
} from '@shared/types/reportes'
import type { Role } from '@shared/types/auth'

type TabType =
  | 'libro'
  | 'ventas'
  | 'compras'
  | 'flujo'
  | 'productos'
  | 'clientes'
  | 'ganancia-producto'
  | 'ganancia-diaria'

export function Contabilidad() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('libro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Datos
  const [libroDiario, setLibroDiario] = useState<LibroDiarioItem[]>([])
  const [selectedLibroItem, setSelectedLibroItem] = useState<LibroDiarioItem | null>(null)
  const [resumenVentas, setResumenVentas] = useState<ResumenPeriodo[]>([])
  const [resumenCompras, setResumenCompras] = useState<ResumenPeriodo[]>([])
  const [flujoCaja, setFlujoCaja] = useState<FlujoCaja | null>(null)
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [clientesMasFrecuentes, setClientesMasFrecuentes] = useState<ClienteMasFrecuente[]>([])
  const [gananciaPorProducto, setGananciaPorProducto] = useState<GananciaProducto[]>([])
  const [gananciaDiaria, setGananciaDiaria] = useState<GananciaDiaria[]>([])

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Determinar qué tabs puede ver el usuario
  const getVisibleTabs = () => {
    const tabs: Array<{ id: TabType; label: string; icon: string; requiredRole?: Role[] }> = [
      { id: 'libro', label: 'Libro Diario', icon: '📋', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'ventas', label: 'Resumen Ventas', icon: '📈', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'compras', label: 'Resumen Compras', icon: '📦', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'flujo', label: 'Flujo de Caja', icon: '💰', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'productos', label: 'Productos Top', icon: '⭐', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'clientes', label: 'Clientes Top', icon: '👥', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'ganancia-producto', label: 'Ganancia por Producto', icon: '🧮', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
      { id: 'ganancia-diaria', label: 'Ganancia Diaria', icon: '📆', requiredRole: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
    ]

    return tabs.filter((tab) => {
      if (!tab.requiredRole) return true
      if (!user?.rol) return false
      if (user.rol === 'SUPERADMIN') return true
      return tab.requiredRole.includes(user.rol)
    })
  }

  const visibleTabs = getVisibleTabs()

  // Cambiar tab por defecto si el activo no está disponible
  useEffect(() => {
    if (!visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'libro')
    }
  }, [user?.rol])

  const fetchLibroDiario = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getLibroDiario({ fechaDesde, fechaHasta })
      setLibroDiario(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar libro diario')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumenVentas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getResumenVentas({ fechaDesde, fechaHasta })
      setResumenVentas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen de ventas')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumenCompras = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getResumenCompras({ fechaDesde, fechaHasta })
      setResumenCompras(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen de compras')
    } finally {
      setLoading(false)
    }
  }

  const fetchFlujoCaja = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getFlujoCaja({ fechaDesde, fechaHasta })
      setFlujoCaja(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar flujo de caja')
    } finally {
      setLoading(false)
    }
  }

  const fetchProductosMasVendidos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getProductosMasVendidos({ fechaDesde, fechaHasta })
      setProductosMasVendidos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos más vendidos')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientesMasFrecuentes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getClientesMasFrecuentes({ fechaDesde, fechaHasta })
      setClientesMasFrecuentes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes más frecuentes')
    } finally {
      setLoading(false)
    }
  }

  const fetchGananciaPorProducto = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getGananciaPorProducto({ fechaDesde, fechaHasta })
      setGananciaPorProducto(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ganancia por producto')
    } finally {
      setLoading(false)
    }
  }

  const fetchGananciaDiaria = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportesService.getGananciaDiaria({ fechaDesde, fechaHasta })
      setGananciaDiaria(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ganancia diaria')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivo = () => {
    if (activeTab === 'libro') fetchLibroDiario()
    else if (activeTab === 'ventas') fetchResumenVentas()
    else if (activeTab === 'compras') fetchResumenCompras()
    else if (activeTab === 'flujo') fetchFlujoCaja()
    else if (activeTab === 'productos') fetchProductosMasVendidos()
    else if (activeTab === 'clientes') fetchClientesMasFrecuentes()
    else if (activeTab === 'ganancia-producto') fetchGananciaPorProducto()
    else if (activeTab === 'ganancia-diaria') fetchGananciaDiaria()
  }

  useEffect(() => {
    fetchActivo()
  }, [activeTab])

  const renderLibroDiario = () => (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Fecha</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Referencia</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Descripción</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Tipo</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">Monto</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">Saldo Acumulado</th>
              <th className="px-4 py-2 text-center text-sm font-semibold">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {libroDiario.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{new Date(item.fecha).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-sm">{item.referencia}</td>
                <td className="px-4 py-2 text-sm">{item.descripcion}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.tipo === 'INGRESO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.tipo}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-sm">${item.monto.toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-sm font-medium">${(item.saldo_acumulado || 0).toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  {item.detalles && item.detalles.length > 0 && (
                    <button
                      onClick={() => setSelectedLibroItem(item)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalles */}
      {selectedLibroItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">Detalles de Transacción</h2>
                <p className="text-sm text-gray-500">
                  {selectedLibroItem.referencia} — {new Date(selectedLibroItem.fecha).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedLibroItem(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Descripción:</span>
                  <p className="font-medium">{selectedLibroItem.descripcion}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className={`font-medium ${
                    selectedLibroItem.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                  }`}>{selectedLibroItem.tipo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-bold text-lg">${selectedLibroItem.monto.toFixed(2)}</p>
                </div>
              </div>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio Unit.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLibroItem.detalles!.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{d.producto}</td>
                      <td className="px-3 py-2 text-right">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right">${d.precio.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium">${d.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const renderResumenPeriodo = (data: ResumenPeriodo[]) => (
    <div className="space-y-4">
      {data.map((periodo) => (
        <div key={periodo.periodo} className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">{periodo.periodo}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-gray-600 text-sm">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">${periodo.totalIngresos.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Egresos</p>
              <p className="text-2xl font-bold text-red-600">${periodo.totalEgresos.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Neto</p>
              <p className={`text-2xl font-bold ${periodo.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${periodo.neto.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Transacciones</p>
              <p className="text-2xl font-bold text-blue-600">{periodo.transacciones}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderFlujoCaja = () => {
    if (!flujoCaja) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Ingresos Totales</p>
            <p className="text-3xl font-bold text-green-600">${flujoCaja.ingresos.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Egresos Totales</p>
            <p className="text-3xl font-bold text-red-600">${flujoCaja.egresos.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Flujo Neto</p>
            <p className={`text-3xl font-bold ${flujoCaja.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${flujoCaja.neto.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Margen (%)</p>
            <p className={`text-3xl font-bold ${flujoCaja.margen >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {flujoCaja.margen.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderProductosMasVendidos = () => (
    <div className="space-y-4">
      {productosMasVendidos.map((producto) => (
        <div key={producto.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{producto.nombre}</h3>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{producto.porcentaje.toFixed(2)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Cantidad Vendida</p>
              <p className="font-bold text-lg">{producto.cantidadVendida} unidades</p>
            </div>
            <div>
              <p className="text-gray-600">Ingreso Total</p>
              <p className="font-bold text-lg text-green-600">${producto.ingresoTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${producto.porcentaje}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderClientesMasFrecuentes = () => (
    <div className="space-y-4">
      {clientesMasFrecuentes.map((cliente) => (
        <div key={cliente.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{cliente.nombre}</h3>
            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">{cliente.porcentaje.toFixed(2)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Transacciones</p>
              <p className="font-bold text-lg">{cliente.transacciones}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Comprado</p>
              <p className="font-bold text-lg text-blue-600">${cliente.totalComprado.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${cliente.porcentaje}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGananciaPorProducto = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">Producto</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Categoría</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Unidades</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Ingresos</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Costos</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Ganancia</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Margen %</th>
          </tr>
        </thead>
        <tbody>
          {gananciaPorProducto.map((item) => (
            <tr key={item.productoId} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">{item.producto}</td>
              <td className="px-4 py-2 text-sm">{item.categoria || 'Sin categoría'}</td>
              <td className="px-4 py-2 text-sm text-right">{item.unidadesVendidas}</td>
              <td className="px-4 py-2 text-sm text-right">${item.ingresos.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm text-right">${item.costos.toFixed(2)}</td>
              <td className={`px-4 py-2 text-sm text-right font-semibold ${item.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${item.ganancia.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-sm text-right">{item.margenPorcentaje.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderGananciaDiaria = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">Fecha</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Ventas</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Pagos Fío</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Compras</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Fíos</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Consumo Interno</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">Neto</th>
          </tr>
        </thead>
        <tbody>
          {gananciaDiaria.map((item) => (
            <tr key={item.fecha} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-sm">{item.fecha}</td>
              <td className="px-4 py-2 text-sm text-right">${item.ingresosVentas.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm text-right">${item.ingresosPagosFio.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm text-right">${item.egresosCompras.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm text-right">${item.egresosFios.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm text-right">${item.egresosConsumoInterno.toFixed(2)}</td>
              <td className={`px-4 py-2 text-sm text-right font-semibold ${item.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${item.neto.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Si no es ADMIN, mostrar acceso limitado
  if (user?.rol !== 'ADMIN' && user?.rol !== 'SUPERADMIN' && visibleTabs.length === 0) {
    return (
      <Layout>
        <div className="p-8 flex justify-center items-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Acceso Limitado</h2>
            <p className="text-yellow-800">Tu rol no tiene acceso a reportes disponibles en este momento.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Reportes Financieros</h1>
        </div>
        <p className="text-gray-600">
          Acceso a reportes financieros globales para el rol {user?.rol}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchActivo}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setFechaDesde('')
                setFechaHasta('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <>
              {activeTab === 'libro' && renderLibroDiario()}
              {activeTab === 'ventas' && renderResumenPeriodo(resumenVentas)}
              {activeTab === 'compras' && renderResumenPeriodo(resumenCompras)}
              {activeTab === 'flujo' && renderFlujoCaja()}
              {activeTab === 'productos' && renderProductosMasVendidos()}
              {activeTab === 'clientes' && renderClientesMasFrecuentes()}
              {activeTab === 'ganancia-producto' && renderGananciaPorProducto()}
              {activeTab === 'ganancia-diaria' && renderGananciaDiaria()}

              {!loading && !error && (
                <div>
                  {activeTab === 'libro' && libroDiario.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'ventas' && resumenVentas.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'compras' && resumenCompras.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'productos' && productosMasVendidos.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'clientes' && clientesMasFrecuentes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'ganancia-producto' && gananciaPorProducto.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                  {activeTab === 'ganancia-diaria' && gananciaDiaria.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </Layout>
  )
}
