import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { consumoInternoService, type ConsumoInterno, type CreateConsumoRequest } from '@/services/consumo-interno'
import { productoService } from '@/services/producto'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Producto {
  id: number
  nombre: string
  stock: number
  precio: number
}

export function ConsumoInternoPage() {
  const [consumos, setConsumos] = useState<ConsumoInterno[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [detalles, setDetalles] = useState<Array<{ productoId: number; cantidad: number }>>([
    { productoId: 0, cantidad: 1 },
  ])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const loadData = async () => {
    try {
      setLoading(true)
      const [consumosData, productosData] = await Promise.all([
        consumoInternoService.getAll(),
        productoService.getAll(1, 1000),
      ])
      setConsumos(Array.isArray(consumosData) ? consumosData : (consumosData as any).data ?? [])
      setProductos(Array.isArray(productosData) ? productosData : (productosData as any).data ?? [])
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addDetalle = () => {
    setDetalles([...detalles, { productoId: 0, cantidad: 1 }])
  }

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const updateDetalle = (index: number, field: string, value: number) => {
    const updated = [...detalles]
    updated[index] = { ...updated[index], [field]: value }
    setDetalles(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const validDetalles = detalles.filter((d) => d.productoId > 0 && d.cantidad > 0)
      if (validDetalles.length === 0) {
        setError('Agrega al menos un producto')
        setSaving(false)
        return
      }
      if (!motivo.trim() || motivo.trim().length < 3) {
        setError('El motivo debe tener al menos 3 caracteres')
        setSaving(false)
        return
      }
      const payload: CreateConsumoRequest = { motivo, detalles: validDetalles }
      await consumoInternoService.create(payload)
      setShowModal(false)
      setMotivo('')
      setDetalles([{ productoId: 0, cantidad: 1 }])
      await loadData()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar consumo'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consumo Interno</h1>
            <p className="text-gray-500 text-sm mt-1">Registra productos usados internamente</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Registrar Consumo
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Motivo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Usuario</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">Productos</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">Costo est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consumos.map((c) => {
                  const isExpanded = expandedRows.has(c.id)
                  const costoTotal = c.detalles?.reduce(
                    (sum, d) => sum + d.cantidad * (d.producto?.precio ?? 0),
                    0,
                  ) ?? 0
                  return (
                    <>
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRow(c.id)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{c.id}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(c.fecha).toLocaleDateString('es-EC')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{c.motivo}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : `#${c.usuarioId}`}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {c.detalles?.length ?? 0} ítem(s)
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          ${costoTotal.toFixed(2)}
                        </td>
                      </tr>
                      {isExpanded && c.detalles && c.detalles.length > 0 && (
                        <tr key={`detail-${c.id}`} className="bg-gray-50">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="rounded-lg border border-gray-200 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left px-4 py-2 text-gray-500 font-medium">Producto</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium">Cantidad</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium">Precio Unit.</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.detalles.map((d) => (
                                    <tr key={d.id} className="border-t border-gray-100">
                                      <td className="px-4 py-2 text-gray-700">{d.producto?.nombre ?? `#${d.productoId}`}</td>
                                      <td className="px-4 py-2 text-right text-gray-700">{d.cantidad}</td>
                                      <td className="px-4 py-2 text-right text-gray-500">${(d.producto?.precio ?? 0).toFixed(2)}</td>
                                      <td className="px-4 py-2 text-right font-medium text-gray-800">${(d.cantidad * (d.producto?.precio ?? 0)).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {consumos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No hay consumos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Registrar Consumo Interno</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  placeholder="Ej: Limpieza local, uso personal..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Productos</label>
                  <button
                    type="button"
                    onClick={addDetalle}
                    className="text-primary-600 text-sm hover:text-primary-800"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {detalles.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={d.productoId}
                        onChange={(e) => updateDetalle(i, 'productoId', Number(e.target.value))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Seleccionar producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (stock: {p.stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={d.cantidad}
                        onChange={(e) => updateDetalle(i, 'cantidad', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {detalles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDetalle(i)}
                          className="text-red-500 hover:text-red-700 text-lg leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Registrando...' : 'Registrar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
