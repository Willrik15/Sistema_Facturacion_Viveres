import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { FacturaViewer } from '@/components/FacturaViewer'
import { ventaService, type Venta } from '@/services/venta'
import { Search, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

const ESTADO_SRI_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  AUTORIZADA:    { label: 'Autorizada',    color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  GENERADA:      { label: 'Generada',      color: 'bg-blue-100 text-blue-800',    icon: Clock },
  RECHAZADA:     { label: 'Rechazada',     color: 'bg-red-100 text-red-800',      icon: XCircle },
  ANULADA:       { label: 'Anulada',       color: 'bg-gray-100 text-gray-600',    icon: XCircle },
  PENDIENTE_ENVIO: { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800', icon: Clock },
}

export function FacturasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null)

  const cargarVentas = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ventaService.getAll()
      setVentas(Array.isArray(data) ? data : [])
    } catch {
      setError('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarVentas()
  }, [])

  const ventasFiltradas = ventas.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      v.factura?.numero?.toLowerCase().includes(q) ||
      v.cliente?.nombre?.toLowerCase().includes(q) ||
      v.cliente?.cedula?.toLowerCase().includes(q) ||
      String(v.id).includes(q)
    )
  })

  const verFactura = async (venta: Venta) => {
    // Si ya tiene detalles cargados, mostrar directo
    if (venta.detalles && venta.detalles.length > 0) {
      setVentaSeleccionada(venta)
      return
    }
    // Si no, cargar el detalle completo
    try {
      const completa = await ventaService.getById(venta.id)
      setVentaSeleccionada(completa)
    } catch {
      setVentaSeleccionada(venta)
    }
  }

  const totalFacturado = ventas
    .filter((v) => v.estado === 'ACTIVA')
    .reduce((sum, v) => sum + v.total, 0)

  const totalAutorizadas = ventas.filter((v) => v.factura?.estadoSRI === 'AUTORIZADA').length
  const totalGeneradas = ventas.filter((v) => v.factura?.estadoSRI === 'GENERADA').length
  const totalAnuladas = ventas.filter((v) => v.estado === 'ANULADA').length

  return (
    <Layout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-primary-600" size={30} />
            Facturas
          </h1>
          <p className="text-gray-600 mt-1">Historial de todas las facturas emitidas</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Facturado</p>
            <p className="text-2xl font-bold text-gray-900">${totalFacturado.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Autorizadas</p>
            <p className="text-2xl font-bold text-green-600">{totalAutorizadas}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Generadas / Pendientes</p>
            <p className="text-2xl font-bold text-blue-600">{totalGeneradas}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Anuladas</p>
            <p className="text-2xl font-bold text-gray-500">{totalAnuladas}</p>
          </div>
        </div>

        {/* Buscador */}
        <Card>
          <div className="relative mb-6">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por número de factura, cliente o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {loading ? (
            <Loading message="Cargando facturas..." />
          ) : ventasFiltradas.length === 0 ? (
            <EmptyState
              title="Sin facturas"
              message={search ? 'No se encontraron facturas con ese criterio' : 'No hay facturas registradas aún'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">N° Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado SRI</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Venta</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => {
                    const estadoSri = venta.factura?.estadoSRI ?? 'GENERADA'
                    const estadoCfg = ESTADO_SRI_CONFIG[estadoSri] ?? ESTADO_SRI_CONFIG['GENERADA']
                    const IconoEstado = estadoCfg.icon
                    return (
                      <tr key={venta.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono text-sm font-medium text-gray-900">
                            {venta.factura?.numero ?? `FAC-${String(venta.id).padStart(9, '0')}`}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{venta.cliente?.nombre ?? '—'}</p>
                          <p className="text-xs text-gray-500">{venta.cliente?.cedula ?? ''}</p>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {new Date(venta.fecha).toLocaleDateString('es-EC')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          ${venta.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoCfg.color}`}>
                            <IconoEstado size={12} />
                            {estadoCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {venta.estado === 'ANULADA' ? (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Anulada</span>
                          ) : (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">Activa</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => verFactura(venta)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {ventaSeleccionada && (
        <FacturaViewer
          venta={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
        />
      )}
    </Layout>
  )
}
