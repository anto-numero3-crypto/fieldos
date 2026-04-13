import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Action {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary'
}

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  actions?: Action[]
  className?: string
}

// Consistent empty state for every list page.
// Centered icon in indigo bubble, title, description, optional action buttons.
export default function EmptyState({ icon: Icon, title, description, actions, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
        <Icon className="h-8 w-8 text-indigo-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          {actions.map((a, i) => (
            <ActionButton key={i} {...a} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButton({ label, onClick, href, variant = 'primary' }: Action): ReactNode {
  const cls = variant === 'primary'
    ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm'
    : 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
  if (href) return <a href={href} className={cls}>{label}</a>
  return <button type="button" onClick={onClick} className={cls}>{label}</button>
}
