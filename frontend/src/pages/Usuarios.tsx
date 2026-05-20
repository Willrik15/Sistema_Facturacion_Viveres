import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { usuarioService, type Usuario, type CreateUsuarioRequest, type RolUsuario } from '@/services/usuario'
import { useAuthStore } from '@/hooks/useAuth'

const ROL_LABELS: Record<RolUsuario, string> = {
  SUPERADMIN: 'Superadministrador',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  BODEGA: 'Bodega',
}

const ROL_COLORS: Record<RolUsuario, string> = {
  SUPERADMIN: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  VENDEDOR: 'bg-blue-100 text-blue-800',
  BODEGA: 'bg-green-100 text-green-800',
}

const STATUS_COLORS = {
  activo: 'bg-emerald-100 text-emerald-800',
  inactivo: 'bg-gray-100 text-gray-700',
}

const emptyForm: CreateUsuarioRequest = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'VENDEDOR',
}

export function UsuariosPage() {
  const { user } = useAuthStore()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateUsuarioRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = user?.rol === 'SUPERADMIN'
  const allowedRoles: RolUsuario[] = isSuperAdmin
    ? ['VENDEDOR', 'BODEGA', 'ADMIN', 'SUPERADMIN']
    : ['VENDEDOR', 'BODEGA']

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const data = await usuarioService.getAll()
      setUsuarios(data)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (u: Usuario) => {
    setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol: u.rol })
    setEditingId(u.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId !== null) {
        const { password, ...rest } = form
        await usuarioService.update(editingId, password ? form : rest)
      } else {
        await usuarioService.create(form)
      }
      setShowModal(false)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar el usuario'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) return
    try {
      await usuarioService.remove(id)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar usuario'))
    }
  }

  const handleReactivate = async (id: number) => {
    try {
      await usuarioService.reactivate(id)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al reactivar usuario'))
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <p className="text-gray-500 text-sm mt-1">Administra los usuarios y sus roles</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Nuevo Usuario
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando usuarios...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">#</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Nombre</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Rol</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Estado</th>
                  <th className="text-left px-6 py-3 text-gray-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{u.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROL_COLORS[u.rol]}`}>
                        {ROL_LABELS[u.rol]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${u.activo ? STATUS_COLORS.activo : STATUS_COLORS.inactivo}`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {(isSuperAdmin || (u.rol !== 'ADMIN' && u.rol !== 'SUPERADMIN')) && (
                          <>
                            <button
                              onClick={() => openEdit(u)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Editar
                            </button>
                            {u.activo ? (
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(u.id)}
                                className="text-emerald-700 hover:text-emerald-900 text-xs font-medium"
                              >
                                Reactivar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {editingId !== null ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editingId !== null && '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={editingId === null}
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {allowedRoles.map((role) => (
                    <option key={role} value={role}>{ROL_LABELS[role]}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingId !== null ? 'Actualizar' : 'Crear'}
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
