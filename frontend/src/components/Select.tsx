interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: boolean
  options: { label: string; value: string }[]
}

export function Select({
  label,
  helperText,
  error,
  options,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col">
      {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        className={`px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
          error
            ? 'border-danger-300 bg-danger-50 text-danger-900'
            : 'border-gray-300 focus:border-primary-500'
        }`}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className={`text-xs mt-1 ${error ? 'text-danger-600' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  )
}
