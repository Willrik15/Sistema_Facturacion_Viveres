import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration === 0) return

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-success-600',
      color: 'text-white',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-danger-600',
      color: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning-600',
      color: 'text-white',
    },
    info: {
      icon: Info,
      bgColor: 'bg-primary-600',
      color: 'text-white',
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={`${config.bgColor} ${config.color} px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto hover:opacity-75">
        <X size={18} />
      </button>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-md w-full px-4 sm:px-0">
      {children}
    </div>
  )
}
