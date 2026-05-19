import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Plus, Search, X, UserPlus, CheckCircle, FileText } from 'lucide-react'
import { ventaService, type Venta } from '@/services/venta'
import { productoService } from '@/services/producto'
import { clienteService, type Cliente, type TipoIdentificacion, type CreateClienteRequest } from '../services/cliente'
import { FacturaViewer } from '@/components/FacturaViewer'

import type { Producto as ProductoApi } from '@/services/producto'
interface Producto extends ProductoApi {
  codigoBarras?: string
}

interface DetalleVenta {
  productoId: number
  cantidad: number
  precio: number
  producto?: Producto
}

// ─── Validaciones de identificación ────────────────────────────────────────
function validarIdentificacion(tipo: TipoIdentificacion, valor: string): string | null {
  if (tipo === 'FINAL') return null
  if (tipo === 'CEDULA') {
    if (!/^\d{10}$/.test(valor)) return 'La cédula debe tener exactamente 10 dígitos'
  } else if (tipo === 'RUC') {
    if (!/^\d{13}$/.test(valor)) return 'El RUC debe tener exactamente 13 dígitos'
  } else if (tipo === 'PASAPORTE') {
    if (valor.length < 5 || valor.length > 20) return 'El pasaporte debe tener entre 5 y 20 caracteres'
  }
  return null
}

const LABEL_TIPO: Record<TipoIdentificacion, string> = {
  CEDULA: 'Cédula',
  RUC: 'RUC',
  PASAPORTE: 'Pasaporte',
  FINAL: 'Consumidor Final',
}

// ─── Estado inicial del formulario de cliente ───────────────────────────────
const FORM_CLIENTE_INICIAL: CreateClienteRequest = {
  nombre: '',
  cedula: '',
  tipoIdentificacion: 'CEDULA',
  email: '',
  telefono: '',
  direccion: '',
}

export function VentasPage() {
  const [ventaForm, setVentaForm] = useState<{ clienteId: number; detalles: DetalleVenta[] }>({
    clienteId: 0,
    detalles: [],
  })
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  // Búsqueda
  const [searchProducto, setSearchProducto] = useState('')
  const [searchCliente, setSearchCliente] = useState('')
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([])
  const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([])
  const [noClienteEncontrado, setNoClienteEncontrado] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [facturaGenerada, setFacturaGenerada] = useState<Venta | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  // Formulario nuevo cliente (inline)
  const [modoCliente, setModoCliente] = useState<'buscar' | 'nuevo'>('buscar')
  const [formCliente, setFormCliente] = useState<CreateClienteRequest>(FORM_CLIENTE_INICIAL)
  const [errorCliente, setErrorCliente] = useState('')
  const [savingCliente, setSavingCliente] = useState(false)
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<number, string>>({})

  // ── Buscar productos ───────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      if (searchProducto.length < 2) { setProductosDisponibles([]); return }
      try {
        setLoading(true)
        const r = await productoService.getAll(1, 20, searchProducto)
        setProductosDisponibles(r?.data || [])
      } catch { /* silent */ } finally { setLoading(false) }
    }
    const t = setTimeout(buscar, 300)
    return () => clearTimeout(t)
  }, [searchProducto])

  // ── Buscar clientes ────────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      if (searchCliente.length < 1) {
        setClientesDisponibles([])
        setNoClienteEncontrado(false)
        return
      }
      try {
        const r = await clienteService.getAll(1, 10, searchCliente)
        const lista = r?.data || []
        setClientesDisponibles(lista)
        setNoClienteEncontrado(lista.length === 0)
      } catch { /* silent */ }
    }
    const t = setTimeout(buscar, 300)
    return () => clearTimeout(t)
  }, [searchCliente])

  // ── Acciones venta ─────────────────────────────────────────────────────
  const seleccionarCliente = (cliente: Cliente) => {
    setVentaForm({ ...ventaForm, clienteId: cliente.id })
    setClienteSeleccionado(cliente)
    setSearchCliente(cliente.nombre)
    setClientesDisponibles([])
    setNoClienteEncontrado(false)
  }

  const deseleccionarCliente = () => {
    setVentaForm({ ...ventaForm, clienteId: 0 })
    setClienteSeleccionado(null)
    setSearchCliente('')
  }

  const agregarProducto = (producto: Producto) => {
    if (producto.stock <= 0) return // no agregar sin stock
    const existe = ventaForm.detalles.find((d) => d.productoId === producto.id)
    if (existe) {
      if (existe.cantidad >= producto.stock) return // no superar stock
      setVentaForm({
        ...ventaForm,
        detalles: ventaForm.detalles.map((d) =>
          d.productoId === producto.id ? { ...d, cantidad: d.cantidad + 1 } : d
        ),
      })
    } else {
      setVentaForm({
        ...ventaForm,
        detalles: [...ventaForm.detalles, { productoId: producto.id, cantidad: 1, precio: producto.precio, producto }],
      })
    }
    setSearchProducto('')
    setProductosDisponibles([])
  }

  const eliminarProducto = (productoId: number) => {
    setVentaForm({ ...ventaForm, detalles: ventaForm.detalles.filter((d) => d.productoId !== productoId) })
    setCantidadDrafts((prev) => {
      const next = { ...prev }
      delete next[productoId]
      return next
    })
  }

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) { eliminarProducto(productoId); return }
    const detalle = ventaForm.detalles.find((d) => d.productoId === productoId)
    const stockMax = detalle?.producto?.stock ?? Infinity
    const cantidadFinal = Math.min(cantidad, stockMax)
    setVentaForm({
      ...ventaForm,
      detalles: ventaForm.detalles.map((d) => d.productoId === productoId ? { ...d, cantidad: cantidadFinal } : d),
    })
    setCantidadDrafts((prev) => ({ ...prev, [productoId]: String(cantidadFinal) }))
  }

  const manejarCambioCantidad = (productoId: number, value: string) => {
    if (value === '') {
      setCantidadDrafts((prev) => ({ ...prev, [productoId]: '' }))
      return
    }
    if (!/^\d+$/.test(value)) return

    setCantidadDrafts((prev) => ({ ...prev, [productoId]: value }))
    const parsed = parseInt(value, 10)
    if (parsed >= 1) {
      actualizarCantidad(productoId, parsed)
    }
  }

  const confirmarCantidad = (productoId: number) => {
    const raw = (cantidadDrafts[productoId] ?? '').trim()
    if (raw === '') {
      actualizarCantidad(productoId, 1)
      return
    }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed) || parsed < 1) {
      actualizarCantidad(productoId, 1)
      return
    }
    actualizarCantidad(productoId, parsed)
  }

  const calcularTotal = () => ventaForm.detalles.reduce((s, d) => s + d.cantidad * d.precio, 0)

  const solicitarConfirmacion = () => {
    if (!ventaForm.clienteId) { setError('Selecciona un cliente'); return }
    if (ventaForm.detalles.length === 0) { setError('Agrega al menos un producto'); return }
    setError('')
    setMostrarConfirmacion(true)
  }

  const crearVenta = async () => {
    setMostrarConfirmacion(false)
    try {
      setLoading(true); setError('')
      const ventaCreada = await ventaService.create({ clienteId: ventaForm.clienteId, detalles: ventaForm.detalles })
      setFacturaGenerada(ventaCreada)
      setVentaForm({ clienteId: 0, detalles: [] })
      setClienteSeleccionado(null)
      setSearchCliente(''); setSearchProducto('')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error al crear venta')
    } finally { setLoading(false) }
  }

  // ── Consumidor Final rápido ────────────────────────────────────────────
  const seleccionarConsumidorFinal = async () => {
    try {
      // Buscar si ya existe
      const r = await clienteService.getAll(1, 1, 'Consumidor Final')
      let cf = r.data.find((c) => c.tipoIdentificacion === 'FINAL' || c.cedula === '9999999999999')
      if (!cf) {
        cf = await clienteService.create({
          nombre: 'Consumidor Final',
          cedula: '9999999999999',
          tipoIdentificacion: 'FINAL',
        })
      }
      seleccionarCliente(cf)
    } catch {
      setError('Error al seleccionar Consumidor Final')
    }
  }

  // ── Crear nuevo cliente ────────────────────────────────────────────────
  const abrirFormNuevoCliente = () => {
    setFormCliente({ ...FORM_CLIENTE_INICIAL, nombre: searchCliente })
    setErrorCliente('')
    setModoCliente('nuevo')
  }

  const onChangeTipoId = (tipo: TipoIdentificacion) => {
    setFormCliente({ ...formCliente, tipoIdentificacion: tipo, cedula: tipo === 'FINAL' ? '9999999999999' : '' })
  }

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorCliente('')

    // Validar identificación
    const errId = validarIdentificacion(formCliente.tipoIdentificacion, formCliente.cedula)
    if (errId) { setErrorCliente(errId); return }
    if (!formCliente.nombre.trim()) { setErrorCliente('El nombre es obligatorio'); return }

    setSavingCliente(true)
    try {
      const payload: CreateClienteRequest = {
        nombre: formCliente.nombre.trim(),
        cedula: formCliente.cedula.trim(),
        tipoIdentificacion: formCliente.tipoIdentificacion,
        ...(formCliente.email?.trim() && { email: formCliente.email.trim() }),
        ...(formCliente.telefono?.trim() && { telefono: formCliente.telefono.trim() }),
        ...(formCliente.direccion?.trim() && { direccion: formCliente.direccion.trim() }),
      }
      const nuevoCliente = await clienteService.create(payload)
      setModoCliente('buscar')
      setFormCliente(FORM_CLIENTE_INICIAL)
      seleccionarCliente(nuevoCliente)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setErrorCliente(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear cliente'))
    } finally { setSavingCliente(false) }
  }

  return (
    <>
    <Layout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
            <p className="text-gray-600">Registra una nueva venta</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-3 md:col-span-2 space-y-6">

            {/* ── CLIENTE ─────────────────────────────────────────────── */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Datos del Cliente</h2>
                <button
                  type="button"
                  onClick={seleccionarConsumidorFinal}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <UserPlus size={15} /> Consumidor Final
                </button>
              </div>

              {/* Cliente ya seleccionado */}
              {clienteSeleccionado ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle size={16} /> {clienteSeleccionado.nombre}
                    </p>
                    <p className="text-sm text-green-600">
                      {LABEL_TIPO[clienteSeleccionado.tipoIdentificacion]}: {clienteSeleccionado.cedula}
                      {clienteSeleccionado.email && ` · ${clienteSeleccionado.email}`}
                    </p>
                    {clienteSeleccionado.direccion && (
                      <p className="text-xs text-green-600">{clienteSeleccionado.direccion}</p>
                    )}
                  </div>
                  <button
                    onClick={deseleccionarCliente}
                    className="p-1 text-green-600 hover:text-red-500 transition"
                    title="Cambiar cliente"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Pestañas Buscar / Nuevo */}
                  <div className="flex rounded-lg border border-gray-200 mb-4 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setModoCliente('buscar')}
                      className={`flex-1 py-2 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                        modoCliente === 'buscar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Search size={14} /> Buscar existente
                    </button>
                    <button
                      type="button"
                      onClick={abrirFormNuevoCliente}
                      className={`flex-1 py-2 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                        modoCliente === 'nuevo'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <UserPlus size={14} /> Nuevo cliente
                    </button>
                  </div>

                  {/* ── Modo buscar ── */}
                  {modoCliente === 'buscar' && (
                    <>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Busca por nombre, cédula o RUC..."
                          value={searchCliente}
                          onChange={(e) => setSearchCliente(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {clientesDisponibles.length > 0 && (
                        <div className="bg-gray-50 rounded-lg max-h-48 overflow-y-auto border border-gray-200">
                          {clientesDisponibles.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => seleccionarCliente(c)}
                              className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0 transition"
                            >
                              <p className="font-medium text-gray-900">{c.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {LABEL_TIPO[c.tipoIdentificacion]}: {c.cedula}
                                {c.email && ` · ${c.email}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {noClienteEncontrado && searchCliente.length >= 1 && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                          <p className="text-sm text-yellow-800">No se encontró "{searchCliente}"</p>
                          <button
                            onClick={abrirFormNuevoCliente}
                            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            <UserPlus size={16} /> Crear nuevo
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Modo nuevo cliente (formulario inline) ── */}
                  {modoCliente === 'nuevo' && (
                    <form onSubmit={guardarCliente} className="space-y-4">
                      {/* Tipo identificación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Identificación <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['CEDULA', 'RUC', 'PASAPORTE', 'FINAL'] as TipoIdentificacion[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => onChangeTipoId(t)}
                              className={`py-2 px-2 rounded-lg border text-xs font-medium transition ${
                                formCliente.tipoIdentificacion === t
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {LABEL_TIPO[t]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Número de identificación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Identificación <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formCliente.cedula}
                          onChange={(e) => setFormCliente({ ...formCliente, cedula: e.target.value })}
                          disabled={formCliente.tipoIdentificacion === 'FINAL'}
                          placeholder={
                            formCliente.tipoIdentificacion === 'CEDULA' ? '10 dígitos' :
                            formCliente.tipoIdentificacion === 'RUC' ? '13 dígitos' :
                            formCliente.tipoIdentificacion === 'FINAL' ? 'Automático' :
                            'Número de pasaporte'
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>

                      {/* Nombre / Razón Social */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formCliente.tipoIdentificacion === 'RUC' ? 'Razón Social' : 'Nombre / Razón Social'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formCliente.nombre}
                          onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                          disabled={formCliente.tipoIdentificacion === 'FINAL'}
                          required
                          placeholder={formCliente.tipoIdentificacion === 'RUC' ? 'Ej: Empresa XYZ S.A.' : 'Nombres y apellidos'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>

                      {/* Dirección */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={formCliente.direccion}
                          onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })}
                          placeholder="Calle principal, ciudad..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-xs text-gray-400">(opcional)</span>
                        </label>
                        <input
                          type="email"
                          value={formCliente.email}
                          onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                          placeholder="cliente@email.com"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={formCliente.telefono}
                          onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                          placeholder="0999999999"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {errorCliente && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          {errorCliente}
                        </div>
                      )}

                      <div className="flex gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={savingCliente}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-sm"
                        >
                          {savingCliente ? 'Guardando...' : 'Guardar y seleccionar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setModoCliente('buscar'); setErrorCliente('') }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </Card>

            {/* ── PRODUCTOS ────────────────────────────────────────────── */}
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Busca producto por nombre o código..."
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {loading && <div className="text-center py-4 text-gray-500">Buscando...</div>}
              {productosDisponibles.length > 0 && (
                <div className="bg-gray-50 rounded-lg max-h-48 overflow-y-auto border border-gray-200">
                  {productosDisponibles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProducto(p)}
                      disabled={p.stock <= 0}
                      className={`w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0 transition ${
                        p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{p.nombre}</p>
                          <p className="text-sm text-gray-500">{p.codigoBarras}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">${p.precio.toFixed(2)}</p>
                          <p className={`text-xs font-medium ${
                            p.stock <= 0 ? 'text-red-600' : p.stock <= 5 ? 'text-orange-500' : 'text-gray-500'
                          }`}>
                            {p.stock <= 0 ? 'Sin stock' : `Stock: ${p.stock}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchProducto && productosDisponibles.length === 0 && !loading && (
                <div className="text-center py-4 text-gray-500">No se encontraron productos</div>
              )}
            </Card>

            {/* ── DETALLES ─────────────────────────────────────────────── */}
            {ventaForm.detalles.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos en la Venta</h2>
                <div className="space-y-2">
                  {ventaForm.detalles.map((d) => (
                    <div key={d.productoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{d.producto?.nombre}</p>
                        <p className="text-sm text-gray-500">${d.precio.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => actualizarCantidad(d.productoId, d.cantidad - 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">-</button>
                        <input
                          type="number"
                          value={cantidadDrafts[d.productoId] ?? String(d.cantidad)}
                          onChange={(e) => manejarCambioCantidad(d.productoId, e.target.value)}
                          onBlur={() => confirmarCantidad(d.productoId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              confirmarCantidad(d.productoId)
                            }
                          }}
                          className="w-12 text-center border border-gray-300 rounded py-1"
                          min="1"
                        />
                        <button onClick={() => actualizarCantidad(d.productoId, d.cantidad + 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                      </div>
                      <div className="text-right min-w-24">
                        <p className="font-semibold text-gray-900">${(d.cantidad * d.precio).toFixed(2)}</p>
                      </div>
                      <button onClick={() => eliminarProducto(d.productoId)} className="ml-4 p-1 text-red-600 hover:bg-red-50 rounded">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ── PREVIEW FACTURA ──────────────────────────────────────── */}
          <div className="col-span-3 md:col-span-1">
            <div className="sticky top-32 space-y-3">
              {/* Ticket preview */}
              <div
                style={{ fontFamily: "'Courier New', monospace" }}
                className="bg-white border border-gray-200 rounded-xl shadow p-4 text-sm text-gray-900"
              >
                {/* Header empresa */}
                <p className="text-center font-bold text-base">VÍVERES LUPITA</p>
                <p className="text-center text-xs text-gray-500">RUC: 0400672887001</p>
                <p className="text-center text-xs text-gray-500">San Gabriel - Carchi</p>
                <hr className="my-2 border-dashed border-gray-400" />

                {/* Info factura */}
                <div className="flex justify-between text-xs">
                  <span className="font-bold">FACTURA N°:</span>
                  <span className="text-gray-500">Se asignará al guardar</span>
                </div>
                <div className="flex justify-between text-xs mt-0.5">
                  <span className="font-bold">Fecha:</span>
                  <span>{new Date().toLocaleDateString('es-EC')}</span>
                </div>

                <hr className="my-2 border-dashed border-gray-400" />

                {/* Cliente */}
                {clienteSeleccionado ? (
                  <>
                    <p className="text-xs font-bold">CLIENTE</p>
                    <p className="text-xs truncate">{clienteSeleccionado.nombre}</p>
                    <p className="text-xs text-gray-500">{LABEL_TIPO[clienteSeleccionado.tipoIdentificacion]}: {clienteSeleccionado.cedula}</p>
                    {clienteSeleccionado.direccion && (
                      <p className="text-xs text-gray-500 truncate">{clienteSeleccionado.direccion}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sin cliente seleccionado</p>
                )}

                <hr className="my-2 border-dashed border-gray-400" />

                {/* Productos */}
                {ventaForm.detalles.length > 0 ? (
                  <>
                    <div className="grid grid-cols-12 text-xs font-bold mb-1">
                      <span className="col-span-2">CANT</span>
                      <span className="col-span-5">DESC</span>
                      <span className="col-span-2 text-right">P.U.</span>
                      <span className="col-span-3 text-right">TOTAL</span>
                    </div>
                    {ventaForm.detalles.map((d) => (
                      <div key={d.productoId} className="grid grid-cols-12 text-xs mb-0.5">
                        <span className="col-span-2">{d.cantidad}</span>
                        <span className="col-span-5 truncate">{d.producto?.nombre}</span>
                        <span className="col-span-2 text-right">${d.precio.toFixed(2)}</span>
                        <span className="col-span-3 text-right">${(d.cantidad * d.precio).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sin productos</p>
                )}

                <hr className="my-2 border-dashed border-gray-400" />

                {/* Totales */}
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>${calcularTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>IVA (0%):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm mt-1 border-t border-gray-900 pt-1">
                  <span>TOTAL:</span>
                  <span className="text-blue-700">${calcularTotal().toFixed(2)}</span>
                </div>

                <hr className="my-2 border-dashed border-gray-400" />
                <p className="text-center text-xs text-gray-400">Gracias por su compra</p>
              </div>

              {/* Botón crear */}
              <button
                onClick={solicitarConfirmacion}
                disabled={loading || ventaForm.detalles.length === 0 || !ventaForm.clienteId}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando...' : <><Plus size={20} /> Crear Venta</>}
              </button>

              {/* Nota SRI */}
              {ventaForm.detalles.length > 0 && ventaForm.clienteId > 0 && (
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <FileText size={12} /> Se generará la factura electrónica para el SRI
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL CREAR CLIENTE ───────────────────────────────────────── */}
    </Layout>

    {/* ── MODAL CONFIRMACIÓN VENTA ─────────────────────────────────── */}
    {mostrarConfirmacion && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Confirmar Venta</h2>
            <p className="text-sm text-gray-500 mb-4">Revisa el resumen antes de confirmar</p>

            {/* Cliente */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Cliente</p>
              <p className="font-medium text-gray-800">{clienteSeleccionado?.nombre || 'Consumidor Final'}</p>
              {clienteSeleccionado?.cedula && (
                <p className="text-sm text-gray-500">CI/RUC: {clienteSeleccionado.cedula}</p>
              )}
            </div>

            {/* Productos */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-2">Productos</p>
              <div className="space-y-1">
                {ventaForm.detalles.map((d) => (
                  <div key={d.productoId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{d.producto?.nombre} × {d.cantidad}</span>
                    <span className="font-medium">${(d.cantidad * d.precio).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                <span>TOTAL</span>
                <span className="text-green-700">${calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4 flex items-center justify-center gap-1">
              <FileText size={12} /> Se generará factura electrónica para el SRI
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={crearVenta}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── MODAL FACTURA GENERADA ─────────────────────────────────── */}
    {facturaGenerada && (
      <FacturaViewer
        venta={facturaGenerada}
        onClose={() => setFacturaGenerada(null)}
      />
    )}
    </>
  )
}


