import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { productoService } from '@/services/producto'
import type { Producto } from '@/services/producto'
import { Plus, Search, Trash2, Edit2, AlertCircle, X } from 'lucide-react'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'

const FORM_INICIAL = {
  nombre: '',
  categoria: '',
  margenGanancia: '25',
  precio: '',
  stock: '',
  stockMinimo: '',
  codigoBarras: '',
}

export function InventarioPage() {
  const { user } = useAuthStore()
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const canManageInventory =
    user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN' || user?.rol === 'BODEGA'

  useEffect(() => {
    cargarProductos()
  }, [page, search])

  const cargarProductos = async () => {
    setLoading(true)
    try {
      const response = await productoService.getAll(page, 10, search)
      const data = response?.data || []
      setProductos(Array.isArray(data) ? data : [])
      if (response?.meta?.lastPage) {
        setTotalPages(response.meta.lastPage)
      }
    } catch {
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    if (!canManageInventory) return
    setEditando(null)
    setForm(FORM_INICIAL)
    setFormError('')
    setShowModal(true)
  }

  const abrirEditar = (p: Producto) => {
    if (!canManageInventory) return
    setEditando(p)
    setForm({
      nombre: p.nombre,
      categoria: p.categoria ?? '',
      margenGanancia: String(p.margenGanancia ?? 25),
      precio: String(p.precio),
      stock: String(p.stock),
      stockMinimo: String(p.stockMinimo),
      codigoBarras: p.codigoBarras ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (form.nombre.trim().length < 3) { setFormError('El nombre debe tener al menos 3 caracteres'); return }
    if (Number(form.precio) <= 0) { setFormError('El precio debe ser mayor a 0'); return }
    if (editando && Number(form.stock) < 0) { setFormError('El stock no puede ser negativo'); return }
    if (form.codigoBarras && !/^\d{13}$/.test(form.codigoBarras)) {
      setFormError('El código de barras debe tener exactamente 13 dígitos numéricos')
      return
    }
    if (Number(form.margenGanancia) < 0) {
      setFormError('El margen de ganancia no puede ser negativo')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim() || undefined,
        margenGanancia: Number(form.margenGanancia || 25),
        precio: Number(form.precio),
        stock: editando ? Number(form.stock) : 0,
        stockMinimo: Number(form.stockMinimo),
        ...(form.codigoBarras ? { codigoBarras: form.codigoBarras } : {}),
      }
      if (editando) {
        await productoService.update(editando.id, payload)
      } else {
        await productoService.create(payload)
      }
      setShowModal(false)
      await cargarProductos()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar producto'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await productoService.delete(id)
        await cargarProductos()
      } catch (err: any) {
        const msg = err?.response?.data?.message
        alert(msg ?? 'Error al eliminar el producto')
      }
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600 mt-1">Gestión de productos ({productos.length})</p>
          </div>
          {canManageInventory && (
            <Button variant="primary" onClick={abrirCrear}>
              <Plus size={20} />
              Nuevo Producto
            </Button>
          )}
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar producto por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <Loading message="Cargando productos..." />
          ) : productos.length === 0 ? (
            <EmptyState
              title="Sin productos"
              message={search ? 'No se encontraron productos con ese criterio' : 'No hay productos registrados aún'}
              action={canManageInventory ? { label: 'Crear primer producto', onClick: abrirCrear } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Mínimo</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                    {canManageInventory && (
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {producto.categoria || 'Sin categoría'} • margen {Number(producto.margenGanancia ?? 25).toFixed(0)}%
                        </p>
                        {producto.codigoBarras && (
                          <p className="text-xs text-gray-500">{producto.codigoBarras}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-medium text-gray-900">${producto.precio.toFixed(2)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <p className={`font-medium ${producto.stock < producto.stockMinimo ? 'text-red-600' : 'text-gray-900'}`}>
                          {producto.stock}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <p className="text-gray-600">{producto.stockMinimo}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {producto.stock < producto.stockMinimo ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning-50 text-warning-700 text-xs font-medium">
                            <AlertCircle size={14} />
                            Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-success-50 text-success-700 text-xs font-medium">
                            Normal
                          </span>
                        )}
                      </td>
                      {canManageInventory && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors" onClick={() => abrirEditar(producto)}>
                              <Edit2 size={16} className="text-primary-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors" onClick={() => handleDelete(producto.id)}>
                              <Trash2 size={16} className="text-danger-600" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="secondary" size="sm">
              Anterior
            </Button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} variant="secondary" size="sm">
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  minLength={3}
                  placeholder="Nombre del producto"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ej: Granos, Lácteos, Aseo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Margen %</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.margenGanancia}
                    onChange={(e) => setForm({ ...form, margenGanancia: e.target.value })}
                    placeholder="25"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual *</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
              {!editando && (
                <p className="text-xs text-gray-500 -mt-1">
                  El producto se crea con stock 0. El inventario aumenta desde compras o kardex.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo *</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                  required
                  placeholder="5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de barras <span className="text-gray-400 font-normal">(13 dígitos, opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.codigoBarras}
                  onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                  placeholder="0000000000000"
                  maxLength={13}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
