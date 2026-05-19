import { Fragment, useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { fioService, type Fio, type CreateFioRequest } from '@/services/fio'
import { clienteService } from '@/services/cliente'
import { productoService } from '@/services/producto'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
  cedula?: string
}

interface Producto {
  id: number
  nombre: string
  stock: number
  precio: number
}

export function FiosPage() {
  const [fios, setFios] = useState<Fio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState<Fio | null>(null)
  const [saving, setSaving] = useState(false)
  const [monto, setMonto] = useState('')
  const [emitirFactura, setEmitirFactura] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [form, setForm] = useState<{
    clienteId: number
    detalles: Array<{ productoId: number; cantidad: number; precio: number }>
  }>({
    clienteId: 0,
    detalles: [{ productoId: 0, cantidad: 1, precio: 0 }],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [fiosData, clientesData, productosData] = await Promise.all([
        fioService.getAll(),
        clienteService.getAll(1, 100),
        productoService.getAll(1, 1000),
      ])
      setFios(Array.isArray(fiosData) ? fiosData : (fiosData as any).data ?? [])
      setClientes(clientesData.data ?? [])
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
    setForm({ ...form, detalles: [...form.detalles, { productoId: 0, cantidad: 1, precio: 0 }] })
  }

  const removeDetalle = (index: number) => {
    setForm({ ...form, detalles: form.detalles.filter((_, i) => i !== index) })
  }

  const updateDetalle = (index: number, field: string, value: number) => {
    const updated = [...form.detalles]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, detalles: updated })
  }

  const onSelectProducto = (index: number, productoId: number) => {
    const producto = productos.find((p) => p.id === productoId)
    const updated = [...form.detalles]
    updated[index] = { ...updated[index], productoId, precio: producto?.precio ?? 0 }
    setForm({ ...form, detalles: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clienteId) {
      setError('Selecciona un cliente')
      return
    }
    const validDetalles = form.detalles.filter(
      (d) => d.productoId > 0 && d.cantidad > 0 && d.precio > 0
    )
    if (validDetalles.length === 0) {
      setError('Agrega al menos un producto')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: CreateFioRequest = { clienteId: form.clienteId, detalles: validDetalles }
      await fioService.create(payload)
      setSuccess('Fío registrado exitosamente')
      setShowModal(false)
      setForm({ clienteId: 0, detalles: [{ productoId: 0, cantidad: 1, precio: 0 }] })
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al registrar fío')
    } finally {
      setSaving(false)
    }
  }

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPagoModal) return
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      setError('Ingresa un monto válido')
      return
    }
    setSaving(true)
    setError('')
    try {
      await fioService.pagar(showPagoModal.id, montoNum, emitirFactura)
      setSuccess('Pago registrado exitosamente')
      setShowPagoModal(null)
      setMonto('')
      setEmitirFactura(false)
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  const calcularTotal = () =>
    form.detalles.reduce((sum, d) => sum + d.cantidad * d.precio, 0)

  const estadoColor = (estado: string) => {
    if (estado === 'PAGADO') return 'bg-green-100 text-green-700'
    if (estado === 'PARCIAL') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fíos (Créditos)</h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de deudas de clientes</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Nuevo Fío
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
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">#</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Fecha</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Cliente</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Total</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Saldo</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Estado</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fios.map((f) => {
                  const isExpanded = expandedRows.has(f.id)
                  return (
                    <Fragment key={f.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(f.id)}>
                        <td className="px-3 py-4 text-gray-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{f.id}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(f.fecha).toLocaleDateString('es-EC')}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {f.cliente?.nombre ?? `Cliente #${f.clienteId}`}
                        </td>
                        <td className="px-6 py-4 text-gray-800">${Number(f.total).toFixed(2)}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          ${Number(f.saldo).toFixed(2)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColor(f.estado)}`}>
                            {f.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {f.estado !== 'PAGADO' && (
                            <button
                              onClick={() => { setShowPagoModal(f); setError('') }}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              Registrar Pago
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-blue-50">
                          <td colSpan={8} className="px-8 py-3">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalle fiado</p>
                                {f.detalles && f.detalles.length > 0 ? (
                                  <div className="rounded-lg border border-blue-100 overflow-hidden bg-white">
                                    <table className="w-full text-xs">
                                      <thead className="bg-blue-100 text-blue-900">
                                        <tr>
                                          <th className="px-3 py-2 text-left">Producto</th>
                                          <th className="px-3 py-2 text-right">Cant.</th>
                                          <th className="px-3 py-2 text-right">Precio</th>
                                          <th className="px-3 py-2 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {f.detalles.map((d) => (
                                          <tr key={d.id} className="border-t border-blue-100">
                                            <td className="px-3 py-1.5">{d.producto?.nombre ?? `Producto #${d.productoId}`}</td>
                                            <td className="px-3 py-1.5 text-right">{d.cantidad}</td>
                                            <td className="px-3 py-1.5 text-right">${Number(d.precio).toFixed(2)}</td>
                                            <td className="px-3 py-1.5 text-right font-semibold">${Number(d.subtotal).toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">Sin detalle disponible</p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Historial de pagos</p>
                                {f.pagos && f.pagos.length > 0 ? (
                                  <div className="rounded-lg border border-blue-100 overflow-hidden bg-white">
                                    <table className="w-full text-xs">
                                      <thead className="bg-blue-100 text-blue-900">
                                        <tr>
                                          <th className="px-3 py-2 text-left">Fecha</th>
                                          <th className="px-3 py-2 text-right">Monto</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {f.pagos.map((p) => (
                                          <tr key={p.id} className="border-t border-blue-100">
                                            <td className="px-3 py-1.5">{new Date(p.fecha).toLocaleDateString('es-EC')}</td>
                                            <td className="px-3 py-1.5 text-right font-semibold text-green-700">${Number(p.monto).toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">Aún no registra pagos</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {fios.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No hay fíos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Fío */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Nuevo Fío</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  value={form.clienteId}
                  onChange={(e) => setForm({ ...form, clienteId: Number(e.target.value) })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Seleccionar cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.cedula ? `(${c.cedula})` : ''}
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
                        onChange={(e) => onSelectProducto(i, Number(e.target.value))}
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
                        placeholder="Precio"
                        value={d.precio || ''}
                        onChange={(e) => updateDetalle(i, 'precio', Number(e.target.value))}
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
                  {saving ? 'Registrando...' : 'Registrar Fío'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError('') }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-gray-800">Registrar Pago</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cliente: <span className="font-medium text-gray-700">{showPagoModal.cliente?.nombre ?? `#${showPagoModal.clienteId}`}</span>
              {' — '}Saldo: <span className="font-semibold text-red-600">${Number(showPagoModal.saldo).toFixed(2)}</span>
            </p>
            <form onSubmit={handlePago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={showPagoModal.saldo}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {/* Checkbox factura electrónica (solo si pago completa el FIO) */}
              {parseFloat(monto) >= Number(showPagoModal.saldo) && Number(showPagoModal.saldo) > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emitirFactura"
                    checked={emitirFactura}
                    onChange={(e) => setEmitirFactura(e.target.checked)}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <label htmlFor="emitirFactura" className="text-sm text-gray-700">
                    Emitir factura electrónica al SRI (opcional)
                  </label>
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Pagando...' : 'Confirmar Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPagoModal(null); setMonto(''); setError('') }}
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

