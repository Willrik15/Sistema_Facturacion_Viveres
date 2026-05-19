import { Fragment, useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { compraService, type Compra, type CreateCompraRequest } from '@/services/compra'
import { proveedorService, type Proveedor } from '@/services/proveedor'
import { productoService } from '@/services/producto'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Producto {
  id: number
  nombre: string
  stock: number
  precio: number
}

export function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Estado para mini-modal de nuevo proveedor
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [proveedorForm, setProveedorForm] = useState({ nombre: '', ruc: '', telefono: '' })
  const [savingProveedor, setSavingProveedor] = useState(false)
  const [proveedorError, setProveedorError] = useState('')

  const [form, setForm] = useState<{
    proveedorId: number
    detalles: Array<{ productoId: number; cantidad: number; costoUnitario: number }>
  }>({
    proveedorId: 0,
    detalles: [{ productoId: 0, cantidad: 1, costoUnitario: 0 }],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [comprasData, proveedoresData, productosData] = await Promise.all([
        compraService.getAll(),
        proveedorService.getAll(),
        productoService.getAll(1, 1000),
      ])
      setCompras(Array.isArray(comprasData) ? comprasData : (comprasData as any).data ?? [])
      setProveedores(proveedoresData)
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

  const addDetalle = () => {
    setForm({ ...form, detalles: [...form.detalles, { productoId: 0, cantidad: 1, costoUnitario: 0 }] })
  }

  const removeDetalle = (index: number) => {
    setForm({ ...form, detalles: form.detalles.filter((_, i) => i !== index) })
  }

  const updateDetalle = (index: number, field: string, value: number) => {
    const updated = [...form.detalles]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, detalles: updated })
  }

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProveedor(true)
    setProveedorError('')
    try {
      const nuevo = await proveedorService.create(proveedorForm)
      setProveedores((prev) => [...prev, nuevo])
      setForm((f) => ({ ...f, proveedorId: nuevo.id }))
      setShowProveedorModal(false)
      setProveedorForm({ nombre: '', ruc: '', telefono: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setProveedorError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear proveedor'))
    } finally {
      setSavingProveedor(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validDetalles = form.detalles.filter(
      (d) => d.productoId > 0 && d.cantidad > 0 && d.costoUnitario > 0
    )
    if (validDetalles.length === 0) {
      setError('Agrega al menos un producto con costo')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: CreateCompraRequest = {
        proveedorId: form.proveedorId > 0 ? form.proveedorId : undefined,
        detalles: validDetalles,
      }
      await compraService.create(payload)
      setSuccess('Compra registrada exitosamente')
      setShowModal(false)
      setForm({ proveedorId: 0, detalles: [{ productoId: 0, cantidad: 1, costoUnitario: 0 }] })
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al registrar compra')
    } finally {
      setSaving(false)
    }
  }

  const handleAnular = async (id: number) => {
    if (!confirm('¿Anular esta compra? Se revertirá el stock.')) return
    try {
      await compraService.anular(id)
      setSuccess('Compra anulada')
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al anular compra'))
    }
  }

  const calcularTotal = () =>
    form.detalles.reduce((sum, d) => sum + d.cantidad * d.costoUnitario, 0)

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de compras a proveedores</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Nueva Compra
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Proveedor</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Ítems</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">Total</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {compras.map((c) => {
                  const isExpanded = expandedRows.has(c.id)
                  return (
                    <Fragment key={c.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRow(c.id)}
                      >
                        <td className="px-3 py-3 text-gray-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{c.id}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(c.fecha).toLocaleDateString('es-EC')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {c.proveedor?.nombre ?? 'General'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {c.detalles?.length ?? 0} ítem(s)
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800 font-semibold">
                          ${Number(c.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              c.estado === 'ANULADA'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {c.estado ?? 'ACTIVA'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {c.estado !== 'ANULADA' && (
                            <button
                              onClick={() => handleAnular(c.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && c.detalles && c.detalles.length > 0 && (
                        <tr key={`${c.id}-det`} className="bg-blue-50">
                          <td colSpan={8} className="px-8 py-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalle de productos</p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-gray-500 border-b border-blue-200">
                                  <th className="pb-1 font-medium">Producto</th>
                                  <th className="pb-1 font-medium text-right">Cantidad</th>
                                  <th className="pb-1 font-medium text-right">Costo Unitario</th>
                                  <th className="pb-1 font-medium text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.detalles.map((d) => (
                                  <tr key={d.id} className="border-b border-blue-100 last:border-0">
                                    <td className="py-1.5 text-gray-800 font-medium">
                                      {d.producto?.nombre ?? `Producto #${d.productoId}`}
                                    </td>
                                    <td className="py-1.5 text-right text-gray-700">{d.cantidad}</td>
                                    <td className="py-1.5 text-right text-gray-700">${Number(d.costoUnitario).toFixed(2)}</td>
                                    <td className="py-1.5 text-right font-semibold text-gray-800">${Number(d.subtotal).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={3} className="pt-2 text-right text-xs font-semibold text-gray-600">TOTAL</td>
                                  <td className="pt-2 text-right font-bold text-primary-700">${Number(c.total).toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No hay compras registradas
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Nueva Compra</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Proveedor <span className="text-gray-400">(opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowProveedorModal(true); setProveedorError('') }}
                    className="text-primary-600 text-xs hover:text-primary-800 font-medium"
                  >
                    + Nuevo proveedor
                  </button>
                </div>
                <select
                  value={form.proveedorId}
                  onChange={(e) => setForm({ ...form, proveedorId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Proveedor General</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
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
                  {form.detalles.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={d.productoId}
                        onChange={(e) => updateDetalle(i, 'productoId', Number(e.target.value))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Seleccionar producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        placeholder="Cant."
                        value={d.cantidad}
                        onChange={(e) => updateDetalle(i, 'cantidad', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        placeholder="Costo"
                        value={d.costoUnitario || ''}
                        onChange={(e) => updateDetalle(i, 'costoUnitario', Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {form.detalles.length > 1 && (
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
                <p className="text-right text-sm font-semibold text-gray-700 mt-2">
                  Total: ${calcularTotal().toFixed(2)}
                </p>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Registrando...' : 'Registrar Compra'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setError('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Nuevo Proveedor */}
      {showProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Nuevo Proveedor</h2>
            <form onSubmit={handleCrearProveedor} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={proveedorForm.nombre}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC (13 dígitos)</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{13}"
                  title="RUC debe tener 13 dígitos"
                  value={proveedorForm.ruc}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, ruc: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1234567890001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{7,10}"
                  title="Teléfono debe tener 7-10 dígitos"
                  value={proveedorForm.telefono}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0999999999"
                />
              </div>
              {proveedorError && <p className="text-red-600 text-sm">{proveedorError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingProveedor}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {savingProveedor ? 'Guardando...' : 'Crear Proveedor'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowProveedorModal(false); setProveedorError('') }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
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

