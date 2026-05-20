import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Coffee,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { canAccess } from '@/config/permissions'
import type { Role } from '@/config/permissions'

interface MenuItem {
  label: string
  href: string
  icon: React.ElementType
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard',        href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Ventas',           href: '/ventas',          icon: ShoppingCart },
  { label: 'Inventario',       href: '/inventario',      icon: Package },
  { label: 'Compras',          href: '/compras',         icon: Truck },
  { label: 'Fios / Fiados',    href: '/fios',            icon: FileText },
  { label: 'Consumo Interno',  href: '/consumo-interno', icon: Coffee },
  { label: 'Kardex',           href: '/kardex',          icon: ClipboardList },
  { label: 'Facturas',         href: '/facturas',        icon: FileText },
  { label: 'Contabilidad',     href: '/contabilidad',    icon: BarChart3 },
  { label: 'Usuarios',         href: '/usuarios',        icon: Users },
]

export function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const visibleItems = MENU_ITEMS.filter((item) =>
    canAccess(user?.rol as Role | undefined, item.href)
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed bottom-6 right-6 z-40 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-primary-900 text-white shadow-lg z-30 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-primary-800">
          <h1 className="text-2xl font-bold">Viveres Lupita</h1>
          <p className="text-sm text-primary-300 mt-1">Sistema de Facturación</p>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto pb-24">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-6 py-4 transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white border-r-4 border-primary-400'
                    : 'text-primary-300 hover:bg-primary-800'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-danger-600 hover:bg-danger-700 text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
