'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['G', 'D'], label: 'Tableau de bord / Dashboard', action: '/dashboard' },
  { keys: ['G', 'C'], label: 'Clients / Customers', action: '/customers' },
  { keys: ['G', 'J'], label: 'Interventions / Jobs', action: '/jobs' },
  { keys: ['G', 'I'], label: 'Factures / Invoices', action: '/invoices' },
  { keys: ['G', 'Q'], label: 'Soumissions / Quotes', action: '/quotes' },
  { keys: ['Ctrl', 'K'], label: 'Palette de commandes / Command palette', action: 'cmd-palette' },
  { keys: ['?'], label: 'Raccourcis clavier / Keyboard shortcuts', action: 'shortcuts' },
  { keys: ['Esc'], label: 'Fermer / Close modal', action: 'escape' },
]

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [gPressed, setGPressed] = useState(false)

  const handleKey = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable
    if (inInput) return

    if (e.key === 'Escape') { setOpen(false); return }

    if (e.key === '?') { setOpen(true); return }

    // G prefix shortcuts
    if (e.key === 'g' || e.key === 'G') {
      setGPressed(true)
      setTimeout(() => setGPressed(false), 1000)
      return
    }

    if (gPressed) {
      const map: Record<string, string> = {
        d: '/dashboard', D: '/dashboard',
        c: '/customers', C: '/customers',
        j: '/jobs',      J: '/jobs',
        i: '/invoices',  I: '/invoices',
        q: '/quotes',    Q: '/quotes',
      }
      if (map[e.key]) {
        router.push(map[e.key])
        setGPressed(false)
      }
    }
  }, [gPressed, router])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Raccourcis clavier</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-1.5">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={i} className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400">Appuyez sur <kbd className="px-1 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-mono">Esc</kbd> pour fermer</p>
        </div>
      </div>
    </div>
  )
}
