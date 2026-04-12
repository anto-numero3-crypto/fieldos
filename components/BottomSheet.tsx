'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

// Bottom sheet modal for mobile action menus, filters, etc.
// Lock scroll while open.
export default function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title || 'Actions'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ActionItemProps {
  icon?: ReactNode
  label: string
  description?: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export function BottomSheetAction({ icon, label, description, onClick, destructive, disabled }: ActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors disabled:opacity-50 ${destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-900 hover:bg-gray-50'}`}
    >
      {icon && <span className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${destructive ? 'bg-red-50' : 'bg-gray-100'}`}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </span>
    </button>
  )
}
