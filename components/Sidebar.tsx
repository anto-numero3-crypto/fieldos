'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Sparkles,
  X,
  LogOut,
  Wrench,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const { lang, setLang, t } = useLanguage()

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/customers', label: t.nav.customers, icon: Users },
    { href: '/jobs', label: t.nav.jobs, icon: Briefcase },
    { href: '/invoices', label: t.nav.invoices, icon: FileText },
    { href: '/assistant', label: t.nav.assistant, icon: Sparkles },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/60 backdrop-blur-sm lg:hidden fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-100',
          'transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight">FieldOS</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden -m-1.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {t.nav.menu}
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-600',
                  ].join(' ')}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                {label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Language switcher */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
            <button
              onClick={() => setLang('en')}
              className={[
                'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-150',
                lang === 'en'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              🇨🇦 EN
            </button>
            <button
              onClick={() => setLang('fr')}
              className={[
                'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-150',
                lang === 'fr'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              🇨🇦 FR
            </button>
          </div>
        </div>

        {/* User section */}
        <div className="shrink-0 border-t border-gray-100 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white">
                <span className="text-xs font-bold text-indigo-700">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-400">{t.nav.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t.nav.signOut}
          </button>
        </div>
      </aside>
    </>
  )
}
