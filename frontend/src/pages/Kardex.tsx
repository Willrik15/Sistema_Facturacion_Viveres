import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { kardexService, type KardexMovimiento } from '@/services/kardex'
import { productoService } from '@/services/producto'
import type { Producto } from '@/services/producto'
import { RefreshCw, Plus, Printer } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'

export function KardexPage() {
  const { user } = useAuthStore()
  const [movimientos, setMovimientos] = useState<KardexMovimiento[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [filtroProductoId, setFiltroProductoId] = useState<number>(0)

  // Modal ajuste
  const [showModal, setShowModal] = useState(false)
  const [ajuste, setAjuste] = useState({
    productoId: 0,
    tipo: 'AJUSTE' as 'ENTRADA' | 'SALIDA' | 'AJUSTE',
    cantidad: 1,
    motivo: '',
  })
  const [saving, setSaving] = useState(false)
  const [ajusteError, setAjusteError] = useState('')

  const canAjuste = user?.rol === 'ADMIN' || user?.rol === 'BODEGA'

  const loadProductos = async () => {
    try {
      const prods = await productoService.getAll(1, 1000)
      setProductos(Array.isArray(prods) ? prods : (prods as any).data ?? [])
    } catch {
      setError('Error al cargar productos')
    }
  }

  const loadMovimientos = async (productoId: number) => {
    if (!productoId) { setMovimientos([]); return }
    setLoading(true)
    setError('')
    try {
      const movs = await kardexService.getByProducto(productoId)
      const sorted = [...(Array.isArray(movs) ? movs : [])].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.id - b.id,
      )
      setMovimientos(sorted)
    } catch {
      setError('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProductos() }, [])
  useEffect(() => { loadMovimientos(filtroProductoId) }, [filtroProductoId])

  const handleAjusteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ajuste.productoId) { setAjusteError('Selecciona un producto'); return }
    if (!ajuste.motivo.trim()) { setAjusteError('Ingresa el motivo'); return }
    setSaving(true)
    setAjusteError('')
    try {
      await kardexService.crearAjuste(ajuste)
      setShowModal(false)
      setAjuste({ productoId: 0, tipo: 'AJUSTE', cantidad: 1, motivo: '' })
      await loadMovimientos(filtroProductoId)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setAjusteError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar ajuste'))
    } finally {
      setSaving(false)
    }
  }

  const productoSeleccionado = productos.find((p) => p.id === filtroProductoId)
  const ultimoMov = movimientos.length > 0 ? movimientos[movimientos.length - 1] : null

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kardex — Promedio Ponderado</h1>
            <p className="text-gray-500 text-sm mt-1">Control de inventario con valoración por costo promedio</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadMovimientos(filtroProductoId)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
            {canAjuste && (
              <button
                onClick={() => { setShowModal(true); setAjusteError('') }}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Registrar Ajuste
              </button>
            )}
            {filtroProductoId > 0 && movimientos.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Printer size={16} />
                Imprimir
              </button>
            )}
          </div>
        </div>

        {/* Selector de producto */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona un artículo</label>
          <select
            value={filtroProductoId}
            onChange={(e) => setFiltroProductoId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full max-w-md"
          >
            <option value={0}>— Seleccionar producto —</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.codigoBarras ? `(${p.codigoBarras})` : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-500">Cargando movimientos...</div>
        )}

        {/* Tabla Kardex clásica */}
        {!loading && filtroProductoId > 0 && (
          <div className="bg-white rounded-xl shadow overflow-hidden print:shadow-none">
            {/* Cabecera del Kardex */}
            <div className="bg-[#7a9a3a] text-white text-center py-3">
              <h2 className="text-xl font-bold tracking-widest uppercase">KARDEX</h2>
            </div>

            <div className="grid grid-cols-2 text-sm border-b border-gray-300">
              <div className="flex border-r border-gray-300">
                <span className="px-4 py-2 font-semibold bg-gray-50 border-r border-gray-200 w-28 shrink-0">Artículo:</span>
                <span className="px-4 py-2 text-gray-800 font-medium">{productoSeleccionado?.nombre ?? '—'}</span>
              </div>
              <div className="flex">
                <span className="px-4 py-2 font-semibold bg-gray-50 border-r border-gray-200 w-44 shrink-0">Existencia mínima:</span>
                <span className="px-4 py-2 text-gray-800">{productoSeleccionado?.stockMinimo ?? '—'}</span>
              </div>
              <div className="flex border-r border-t border-gray-300">
                <span className="px-4 py-2 font-semibold bg-gray-50 border-r border-gray-200 w-28 shrink-0">Método:</span>
                <span className="px-4 py-2 text-gray-600 italic">Promedio ponderado</span>
              </div>
              <div className="flex border-t border-gray-300">
                <span className="px-4 py-2 font-semibold bg-gray-50 border-r border-gray-200 w-44 shrink-0">Stock actual:</span>
                <span className="px-4 py-2 text-gray-800">{productoSeleccionado?.stock ?? '—'}</span>
              </div>
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#7a9a3a] text-white">
                    <th rowSpan={2} className="border border-[#5a7a2a] px-2 py-2 text-center w-24">Fecha</th>
                    <th rowSpan={2} className="border border-[#5a7a2a] px-4 py-2 text-center">Detalle</th>
                    <th colSpan={3} className="border border-[#5a7a2a] px-2 py-2 text-center">Entradas</th>
                    <th colSpan={3} className="border border-[#5a7a2a] px-2 py-2 text-center">Salidas</th>
                    <th colSpan={3} className="border border-[#5a7a2a] px-2 py-2 text-center">Existencias</th>
                  </tr>
                  <tr className="bg-[#9ab84e] text-white text-xs">
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">Cantidad</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Unitario</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Total</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">Cantidad</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Unitario</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Total</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">Cantidad</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Unitario</th>
                    <th className="border border-[#5a7a2a] px-2 py-1 text-right">V/Total</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-gray-400">
                        No hay movimientos registrados para este producto
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((m, idx) => {
                      const fecha = new Date(m.fecha)
                      const dd = String(fecha.getDate()).padStart(2, '0')
                      const mm = String(fecha.getMonth() + 1).padStart(2, '0')
                      const aa = String(fecha.getFullYear()).slice(-2)
                      const isEntrada = m.tipo === 'ENTRADA'
                      const isSalida = m.tipo === 'SALIDA'
                      const costoMov = m.costoUnitario ?? 0
                      const totalMov = m.cantidad * costoMov
                      const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f0f5e8]'
                      return (
                        <tr key={m.id} className={rowBg}>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">{dd}/{mm}/{aa}</td>
                          <td className="border border-gray-300 px-4 py-1.5">
                            {m.referencia ?? (isEntrada ? 'Entrada' : isSalida ? 'Salida' : 'Ajuste')}
                          </td>
                          {/* ENTRADAS */}
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isEntrada ? m.cantidad : ''}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isEntrada ? costoMov.toFixed(2) : ''}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isEntrada ? totalMov.toFixed(2) : ''}</td>
                          {/* SALIDAS */}
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isSalida ? m.cantidad : ''}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isSalida ? costoMov.toFixed(2) : ''}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right">{isSalida ? totalMov.toFixed(2) : ''}</td>
                          {/* EXISTENCIAS */}
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-medium">{m.saldo}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-medium">{m.costoUnitario.toFixed(2)}</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-right font-medium">{m.costoTotal.toFixed(2)}</td>
                        </tr>
                      )
                    })
                  )}

                  {/* Inventario Final */}
                  {ultimoMov && (
                    <tr className="bg-[#f0f5e8] font-bold text-[#c0392b]">
                      <td colSpan={8} className="border border-gray-300 px-4 py-2 text-right italic">
                        Inventario Final
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right">{ultimoMov.saldo}</td>
                      <td className="border border-gray-300 px-2 py-2 text-right">{ultimoMov.costoUnitario.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-2 text-right">{ultimoMov.costoTotal.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filtroProductoId === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Selecciona un artículo para ver su Kardex</p>
          </div>
        )}
      </div>

      {/* Modal Ajuste */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Registrar Ajuste de Inventario</h2>
            {ajusteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{ajusteError}</div>
            )}
            <form onSubmit={handleAjusteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  value={ajuste.productoId}
                  onChange={(e) => setAjuste({ ...ajuste, productoId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value={0}>Seleccionar producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ajuste</label>
                <select
                  value={ajuste.tipo}
                  onChange={(e) => setAjuste({ ...ajuste, tipo: e.target.value as typeof ajuste.tipo })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="AJUSTE">Ajuste (corrección)</option>
                  <option value="ENTRADA">Entrada (incrementar stock)</option>
                  <option value="SALIDA">Salida (reducir stock)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" min={1} value={ajuste.cantidad}
                  onChange={(e) => setAjuste({ ...ajuste, cantidad: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input type="text" value={ajuste.motivo}
                  onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })}
                  placeholder="Ej: Producto dañado, pérdida en bodega..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm">
                  {saving ? 'Guardando...' : 'Registrar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
