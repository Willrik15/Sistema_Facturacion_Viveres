import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  variant: AlertVariant
  title: string
  message: string
  onClose?: () => void
  dismissible?: boolean
}

export function Alert({ variant, title, message, onClose, dismissible = true }: AlertProps) {
  const [closed, setClosed] = useState(false)

  const handleClose = () => {
    setClosed(true)
    onClose?.()
  }

  if (closed) return null

  const variantConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-success-50',
      textColor: 'text-success-900',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-danger-50',
      textColor: 'text-danger-900',
      borderColor: 'border-danger-200',
      iconColor: 'text-danger-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-900',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-600',
    },
    info: {
      icon: InfoIcon,
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-900',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-600',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 flex gap-3 items-start`}
    >
      <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <h4 className={`font-semibold ${config.textColor}`}>{title}</h4>
        <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={handleClose}
          className={`${config.textColor} hover:opacity-70 flex-shrink-0`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
