'use client'

import { useLanguage } from '@/lib/LanguageContext'

interface Employee {
  id: string
  first_name: string
  last_name: string
  color: string
}

interface EmployeePickerProps {
  employees: Employee[]
  selected: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export default function EmployeePicker({ employees, selected, onChange, label }: EmployeePickerProps) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const count = selected.length

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="flex flex-wrap gap-2">
        {employees.map((emp) => {
          const isSelected = selected.includes(emp.id)
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => toggle(emp.id)}
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all border',
                isSelected
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: emp.color || '#6366f1' }}
              />
              {emp.first_name} {emp.last_name}
            </button>
          )
        })}
      </div>
      {employees.length > 0 && (
        <p className="text-xs text-gray-500 mt-1.5">
          {count === 0
            ? (fr ? 'Aucun technicien assign\u00e9' : 'No technician assigned')
            : (fr
                ? `${count} technicien${count > 1 ? 's' : ''} assign\u00e9${count > 1 ? 's' : ''}`
                : `${count} technician${count > 1 ? 's' : ''} assigned`)}
        </p>
      )}
    </div>
  )
}
