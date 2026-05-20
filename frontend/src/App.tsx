import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { authService } from '@/services/auth'
import { canAccess } from '@/config/permissions'
import type { Role } from '@/config/permissions'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { Dashboard } from '@/pages/Dashboard'
import { InventarioPage } from '@/pages/Inventario'
import { VentasPage } from '@/pages/Ventas'
import { ChatbotPage } from '@/pages/Chatbot'
import { ComprasPage } from '@/pages/Compras'
import { FiosPage } from '@/pages/Fios'
import { Contabilidad } from '@/pages/Contabilidad'
import { Settings } from '@/pages/Settings'
import { ConsumoInternoPage } from '@/pages/ConsumoInterno'
import { UsuariosPage } from '@/pages/Usuarios'
import { KardexPage } from '@/pages/Kardex'
import { FacturasPage } from '@/pages/Facturas'

function ProtectedRoute({
  children,
  path,
}: {
  children: React.ReactNode
  path: string
}) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (!canAccess(user?.rol as Role | undefined, path)) {
    return <Navigate to="/dashboard" />
  }
  return <>{children}</>
}

export function App() {
  const { isAuthenticated, user, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || user) return

    authService
      .getProfile()
      .then((profile) => setUser(profile))
      .catch(() => logout())
  }, [isAuthenticated, user, setUser, logout])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute path="/dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario"
          element={
            <ProtectedRoute path="/inventario">
              <InventarioPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ventas"
          element={
            <ProtectedRoute path="/ventas">
              <VentasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chatbot"
          element={
            <ProtectedRoute path="/chatbot">
              <ChatbotPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/compras"
          element={
            <ProtectedRoute path="/compras">
              <ComprasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fios"
          element={
            <ProtectedRoute path="/fios">
              <FiosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consumo-interno"
          element={
            <ProtectedRoute path="/consumo-interno">
              <ConsumoInternoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kardex"
          element={
            <ProtectedRoute path="/kardex">
              <KardexPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/facturas"
          element={
            <ProtectedRoute path="/facturas">
              <FacturasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contabilidad"
          element={
            <ProtectedRoute path="/contabilidad">
              <Contabilidad />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute path="/usuarios">
              <UsuariosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute path="/settings">
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
