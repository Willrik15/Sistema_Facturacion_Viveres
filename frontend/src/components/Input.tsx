interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border transition-colors 
          ${
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-gray-300 focus:ring-primary-500'
          }
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger-600 mt-1">{error}</p>}
      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </div>
  )
}
