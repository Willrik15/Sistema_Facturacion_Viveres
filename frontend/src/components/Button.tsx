interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2'

  const variantClass = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:bg-gray-300',
    success: 'bg-success-600 hover:bg-success-700 text-white disabled:bg-gray-400',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white disabled:bg-gray-400',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white disabled:bg-gray-400',
  }

  const sizeClass = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="animate-spin">⏳</div>}
      {children}
    </button>
  )
}
