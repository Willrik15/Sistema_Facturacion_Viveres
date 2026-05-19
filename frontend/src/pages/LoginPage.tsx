import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/hooks/useAuth'
import { AlertCircle } from 'lucide-react'
import { getErrorMessage } from '@/utils/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const response = await authService.login({ email, password })
      
      // Guardar token
      setToken(response.access_token)
      
      // Obtener y guardar usuario
      if (response.user) {
        setUser(response.user)
      } else {
        // Si no viene el usuario en la respuesta, obtenerlo del perfil
        const user = await authService.getProfile()
        setUser(user)
      }
      
      // Redirigir al dashboard
      navigate('/')
    } catch (err: any) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg || 'Error al iniciar sesión. Verifica tus credenciales.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-soft-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Viveres Lupita</h1>
            <p className="text-gray-600 mt-2">Sistema de Facturación</p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 mb-6 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertCircle size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {info && (
            <div className="flex gap-3 p-4 mb-6 bg-success-50 border border-success-200 rounded-lg">
              <AlertCircle size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-success-700">{info}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              disabled={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <button
              type="button"
              onClick={() => window.open('/reset-password', '_blank')}
              className="w-full text-sm text-primary-700 hover:text-primary-800 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
