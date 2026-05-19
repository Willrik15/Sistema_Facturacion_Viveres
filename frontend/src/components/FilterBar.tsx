import { Select } from './Select'
import { Input } from './Input'

interface FilterProps {
  onFilter: (filters: Record<string, any>) => void
  filterOptions?: {
    label: string
    key: string
    type: 'text' | 'select' | 'date'
    options?: { label: string; value: string }[]
  }[]
}

export function FilterBar({ onFilter, filterOptions = [] }: FilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
      {filterOptions.map((option) => (
        <div key={option.key} className="flex-1">
          {option.type === 'select' && option.options ? (
            <Select
              label={option.label}
              options={option.options}
              onChange={(value) => onFilter({ [option.key]: value })}
            />
          ) : (
            <Input
              label={option.label}
              type={option.type}
              placeholder={option.label}
              onChange={(e) => onFilter({ [option.key]: e.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  )
}
