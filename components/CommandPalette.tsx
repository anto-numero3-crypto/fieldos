'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, Users, Briefcase, FileText, FileSignature,
  Calendar, BarChart3, Settings, CreditCard, Users2, Sparkles, Globe,
  Plus, ArrowRight, X,
} from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  href?: string
  action?: () => void
  group: string
  keywords?: string
}

const NAV_ITEMS: PaletteItem[] = [
  { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard,  href: '/dashboard',  group: 'Pages', keywords: 'home overview kpi' },
  { id: 'customers',  label: 'Customers',        icon: Users,            href: '/customers',  group: 'Pages', keywords: 'clients contacts' },
  { id: 'jobs',       label: 'Jobs',             icon: Briefcase,        href: '/jobs',       group: 'Pages', keywords: 'work orders tasks' },
  { id: 'quotes',     label: 'Quotes',           icon: FileSignature,    href: '/quotes',     group: 'Pages', keywords: 'estimates proposals' },
  { id: 'invoices',   label: 'Invoices',         icon: FileText,         href: '/invoices',   group: 'Pages', keywords: 'billing payment' },
  { id: 'schedule',   label: 'Schedule',         icon: Calendar,         href: '/schedule',   group: 'Pages', keywords: 'calendar appointments' },
  { id: 'team',       label: 'Team',             icon: Users2,           href: '/team',       group: 'Pages', keywords: 'staff employees technicians' },
  { id: 'reports',    label: 'Reports',          icon: BarChart3,        href: '/reports',    group: 'Pages', keywords: 'analytics revenue' },
  { id: 'assistant',  label: 'AI Assistant',     icon: Sparkles,         href: '/assistant',  group: 'Pages', keywords: 'ai chat ask help' },
  { id: 'book',       label: 'Booking Portal',   icon: Globe,            href: '/book',       group: 'Pages', keywords: 'public booking' },
  { id: 'settings',   label: 'Settings',         icon: Settings,         href: '/settings',   group: 'Pages', keywords: 'profile configuration' },
  { id: 'billing',    label: 'Billing',          icon: CreditCard,       href: '/billing',    group: 'Pages', keywords: 'subscription plan' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const CREATE_ITEMS: PaletteItem[] = [
    { id: 'new-customer', label: 'New Customer',  description: 'Add a new client',        icon: Users,         href: '/customers', group: 'Create', keywords: 'add create' },
    { id: 'new-job',      label: 'New Job',        description: 'Create a work order',     icon: Briefcase,     href: '/jobs',      group: 'Create', keywords: 'add create' },
    { id: 'new-invoice',  label: 'New Invoice',    description: 'Create an invoice',       icon: FileText,      href: '/invoices',  group: 'Create', keywords: 'add create bill' },
    { id: 'new-quote',    label: 'New Quote',      description: 'Create an estimate',      icon: FileSignature, href: '/quotes',    group: 'Create', keywords: 'add create estimate' },
  ]

  const allItems = [...CREATE_ITEMS, ...NAV_ITEMS]

  const filtered = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.includes(q)
        )
      })
    : allItems

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const flatItems = Object.values(grouped).flat()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  const execute = useCallback((item: PaletteItem) => {
    setOpen(false)
    setQuery('')
    if (item.action) item.action()
    else if (item.href) router.push(item.href)
  }, [router])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, flatItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && flatItems[selected]) execute(flatItems[selected])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages, actions, commands…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:flex h-5 items-center rounded bg-gray-100 px-1.5 text-[10px] font-mono text-gray-500">ESC</kbd>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{group}</p>
                {items.map((item) => {
                  const globalIdx = flatItems.indexOf(item)
                  const isSelected = globalIdx === selected
                  return (
                    <button
                      key={item.id}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelected(globalIdx)}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        item.group === 'Create' ? 'bg-indigo-100' : 'bg-gray-100',
                      ].join(' ')}>
                        {item.group === 'Create'
                          ? <Plus className="h-4 w-4 text-indigo-600" />
                          : <item.icon className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{item.label}</p>
                        {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                      </div>
                      {isSelected && <ArrowRight className="h-4 w-4 text-indigo-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><kbd className="rounded bg-white border border-gray-200 px-1 font-mono text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded bg-white border border-gray-200 px-1 font-mono text-[10px]">↵</kbd> Open</span>
          </div>
          <span className="text-[11px] text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
