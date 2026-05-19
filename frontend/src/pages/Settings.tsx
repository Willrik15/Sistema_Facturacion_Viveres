import { Layout } from '@/components/Layout'
import { Settings as SettingsIcon, User, Lock, Bell, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function Settings() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'notificaciones'>('perfil')
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          </div>
          <p className="text-gray-600 mt-1">Administra tu perfil y preferencias</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Menú Lateral */}
          <div className="col-span-4 md:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-32">
              {[
                { id: 'perfil', label: 'Mi Perfil', icon: User },
                { id: 'seguridad', label: 'Seguridad', icon: Lock },
                { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition border-b border-gray-200 last:border-b-0 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenido */}
          <div className="col-span-4 md:col-span-3">
            {/* Mi Perfil */}
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Mi Perfil</h2>

                {/* Avatar */}
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-5xl font-bold">
                    {(user?.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{user?.nombre}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {user?.rol}
                    </span>
                  </div>
                </div>

                {/* Información */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-gray-900 mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Rol</p>
                    <p className="text-gray-900 mt-1">{user?.rol}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Editar Perfil
                  </button>
                </div>
              </div>
            )}

            {/* Seguridad */}
            {activeTab === 'seguridad' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Seguridad</h2>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left font-medium text-gray-900 transition"
                  >
                    Cambiar Contraseña
                  </button>

                  {showChangePassword && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña Actual
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          Guardar
                        </button>
                        <button
                          onClick={() => setShowChangePassword(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Sesiones Activas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Chrome en Windows</p>
                        <p className="text-sm text-gray-600">Activa ahora</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-medium text-sm">Cerrar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notificaciones */}
            {activeTab === 'notificaciones' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Notificaciones</h2>

                <div className="space-y-4">
                  {[
                    { label: 'Nuevas ventas', desc: 'Notificaciones de ventas realizadas' },
                    { label: 'Pedidos completados', desc: 'Cuando se completa un pedido' },
                    { label: 'Inventario bajo', desc: 'Recordatorio de stock bajo' },
                    { label: 'Reportes diarios', desc: 'Resumen de ventas del día' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </Layout>
  )
}
