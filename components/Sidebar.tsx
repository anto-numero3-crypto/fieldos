'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import {
  LayoutDashboard, Users, Briefcase, FileText, Sparkles, X, LogOut, Wrench,
  Calendar, FileSignature, BarChart3, Settings, CreditCard, Users2,
  Bell, ChevronDown, Globe,
} from 'lucide-react'

interface SidebarProps { open: boolean; onClose: () => void }

const navSections = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/schedule',   label: 'Schedule',   icon: Calendar },
      { href: '/jobs',       label: 'Jobs',       icon: Briefcase },
      { href: '/quotes',     label: 'Quotes',     icon: FileSignature },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/invoices',  label: 'Invoices',  icon: FileText },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/team',    label: 'Team',    icon: Users2 },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
]

const bottomItems = [
  { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/book',      label: 'Booking Portal', icon: Globe },
  { href: '/settings',  label: 'Settings',     icon: Settings },
  { href: '/billing',   label: 'Billing',      icon: CreditCard },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser]   = useState<{ email?: string; id?: string } | null>(null)
  const [unread, setUnread] = useState(0)
  const { lang, setLang } = useLanguage()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', data.user.id)
          .eq('read', false)
          .then(({ count }) => setUnread(count || 0))
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

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

      {/* Panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800',
          'transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">FieldOS</span>
              <span className="ml-1.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-600">PRO</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden -m-1.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={[
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                      ].join(' ')}
                    >
                      <Icon
                        className={[
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600',
                        ].join(' ')}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      {label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Bottom nav items */}
          <div>
            <p className="px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              More
            </p>
            <div className="space-y-0.5">
              {bottomItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={[
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600',
                      ].join(' ')}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    {label}
                    {href === '/assistant' && (
                      <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-1.5 py-0.5 text-xs font-bold text-white">AI</span>
                    )}
                    {href !== '/assistant' && unread > 0 && href === '/notifications' && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{unread}</span>
                    )}
                    {active && href !== '/assistant' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Language switcher */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
            {(['en', 'fr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={[
                  'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-150',
                  lang === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600',
                ].join(' ')}
              >
                {l === 'en' ? '🇨🇦 EN' : '🇨🇦 FR'}
              </button>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white shadow-sm">
                <span className="text-xs font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{user.email}</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-gray-400">Field Manager</p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
