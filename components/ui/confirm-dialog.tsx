'use client'

import { ReactNode, useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  // If set, an optional textarea input is shown — value is passed to onConfirm.
  prompt?: { label: string; placeholder?: string }
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<{ confirmed: boolean; promptValue?: string }>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

interface ActiveDialog extends ConfirmOptions {
  resolve: (v: { confirmed: boolean; promptValue?: string }) => void
}

// Provider — mount once, near the root layout.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [active, setActive] = useState<ActiveDialog | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setPromptValue('')
    return new Promise<{ confirmed: boolean; promptValue?: string }>((resolve) => {
      lastFocusedRef.current = (document.activeElement as HTMLElement) || null
      setActive({ ...opts, resolve })
    })
  }, [])

  const close = useCallback((confirmed: boolean) => {
    if (!active) return
    active.resolve({ confirmed, promptValue: confirmed && active.prompt ? promptValue : undefined })
    setActive(null)
    setPromptValue('')
    requestAnimationFrame(() => lastFocusedRef.current?.focus?.())
  }, [active, promptValue])

  // Lock body scroll + ESC handling + initial focus.
  useEffect(() => {
    if (!active) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Initial focus: cancel button (safer for destructive intent)
    const t = setTimeout(() => cancelBtnRef.current?.focus(), 10)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false) }
      if (e.key === 'Tab') {
        // Trivial focus trap between cancel + confirm
        const focusables = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLElement[]
        if (focusables.length === 0) return
        const idx = focusables.findIndex((el) => el === document.activeElement)
        e.preventDefault()
        const next = e.shiftKey
          ? focusables[(idx - 1 + focusables.length) % focusables.length]
          : focusables[(idx + 1) % focusables.length]
        next?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [active, close])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4"
        >
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => close(false)}
              aria-label={fr ? 'Fermer' : 'Close'}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-6">
              <div className="flex items-start gap-3">
                {active.destructive !== false && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 id="confirm-title" className="text-base font-bold text-gray-900 dark:text-white">{active.title}</h2>
                  {active.description && (
                    <p id="confirm-desc" className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{active.description}</p>
                  )}
                </div>
              </div>

              {active.prompt && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{active.prompt.label}</label>
                  <textarea
                    rows={3}
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder={active.prompt.placeholder}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 px-6 py-3">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {active.cancelLabel || (fr ? 'Annuler' : 'Cancel')}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  active.destructive !== false
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/40'
                }`}
              >
                {active.confirmLabel || (fr ? 'Confirmer' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// Hook used everywhere we need a confirm:
//   const confirm = useConfirm()
//   const { confirmed } = await confirm({ title, description, confirmLabel })
//   if (!confirmed) return
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx.confirm
}
