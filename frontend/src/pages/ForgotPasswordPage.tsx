import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { authService } from '@/services/auth'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { getErrorMessage } from '@/utils/errors'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('resetToken')
    if (token) {
      setResetToken(token)
      setStep('reset')
    }
  }, [])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const response = await authService.forgotPassword(resetEmail)
      setInfo(response.message)
    } catch (err: any) {
      setError(getErrorMessage(err) || 'No se pudo procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!resetToken.trim()) {
      setError('Ingresa el token de recuperación')
      return
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const response = await authService.resetPassword(resetToken, newPassword)
      setInfo(response.message)
      setDone(true)
    } catch (err: any) {
      setError(getErrorMessage(err) || 'No se pudo actualizar la contraseña')
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
            <p className="text-gray-600 mt-2">Recuperación de contraseña</p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 mb-6 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertCircle size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {info && (
            <div className="flex gap-3 p-4 mb-6 bg-success-50 border border-success-200 rounded-lg">
              <CheckCircle size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-success-700">{info}</p>
            </div>
          )}

          {done ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-sm">Tu contraseña ha sido restablecida. Ya puedes iniciar sesión.</p>
              <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                Ir al inicio de sesión
              </Button>
            </div>
          ) : step === 'request' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" disabled={loading}>
                  Enviar enlace de recuperación
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="w-full text-sm text-primary-700 hover:text-primary-800 font-medium"
              >
                Ya tengo un token de recuperación
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa el token que recibiste por correo y tu nueva contraseña.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Token de recuperación"
                  type="text"
                  placeholder="Pega aquí el token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                <Input
                  label="Nueva contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirmar nueva contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" disabled={loading}>
                  Restablecer contraseña
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-xs text-gray-500 hover:text-gray-700"
              >
                Volver atrás
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
