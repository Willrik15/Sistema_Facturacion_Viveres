import { Bell, Settings, LogOut, ChevronDown, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { productoService } from '@/services/producto'

interface ProductoBajoStock {
  id: number
  nombre: string
  stock: number
  stockMinimo: number
}

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([])

  useEffect(() => {
    productoService.getAll(1, 1000).then((res: any) => {
      const data: any[] = Array.isArray(res) ? res : (res?.data ?? [])
      setProductosBajoStock(data.filter((p) => p.stock < p.stockMinimo))
    }).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSettings = () => {
    navigate('/settings')
    setDropdownOpen(false)
  }

  const getRolColor = (rol?: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'VENDEDOR':
        return 'bg-blue-100 text-blue-800'
      case 'BODEGA':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-24 bg-white border-b border-gray-200 shadow-sm z-20">
      <div className="h-full flex items-center justify-between px-4 md:px-8">
        {/* Izquierda: Bienvenida */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Bienvenido
          </h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-EC', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Derecha: Usuario y opciones */}
        <div className="flex items-center gap-6">
          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Notificaciones"
            >
              <Bell size={20} />
              {productosBajoStock.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {productosBajoStock.length > 9 ? '9+' : productosBajoStock.length}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                  {productosBajoStock.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {productosBajoStock.length} alertas
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {productosBajoStock.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div>
                      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-orange-700 uppercase tracking-wide">
                        ⚠️ Productos bajo stock mínimo
                      </p>
                      {productosBajoStock.map((p) => (
                        <div key={p.id} className="px-4 py-3 border-b border-gray-100 last:border-0 flex items-center gap-3 hover:bg-orange-50">
                          <div className="p-1.5 bg-orange-100 rounded-lg shrink-0">
                            <AlertTriangle size={14} className="text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                            <p className="text-xs text-orange-600">
                              Stock actual: <strong>{p.stock}</strong> — Mínimo: {p.stockMinimo}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Usuario y Dropdown */}
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.nombre || 'Usuario'}
              </p>
              <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${getRolColor(user?.rol)}`}>
                {user?.rol || 'SIN ROL'}
              </span>
            </div>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {(user?.nombre || 'U').charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.rol}</p>
                  </div>
                  
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                  >
                    <Settings size={16} />
                    Configuración
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
