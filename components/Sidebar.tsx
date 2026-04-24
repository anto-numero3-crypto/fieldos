'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import {
  LayoutDashboard, Users, Briefcase, FileText, Sparkles, X, LogOut,
  Calendar, FileSignature, BarChart3, Settings, Users2,
  Clock, Package, Wallet,
} from 'lucide-react'
import { isModuleEnabled } from '@/lib/modules'
import GestivioLogo from '@/components/GestivioLogo'

interface SidebarProps { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [user, setUser]   = useState<{ email?: string; id?: string } | null>(null)
  const [orgPlan, setOrgPlan] = useState<string | null>(null)
  const [orgModules, setOrgModules] = useState<Record<string, boolean> | null>(null)

  const navSections = [
    {
      label: fr ? 'OPERATIONS' : 'OPERATIONS',
      items: [
        { href: '/dashboard',              label: fr ? 'Tableau de bord' : 'Dashboard',    icon: LayoutDashboard },
        { href: '/schedule',               label: fr ? 'Calendrier' : 'Schedule',           icon: Calendar },
        { href: '/jobs',                   label: fr ? 'Interventions' : 'Jobs',             icon: Briefcase },
        { href: '/quotes',                 label: fr ? 'Devis' : 'Quotes',                  icon: FileSignature },
      ],
    },
    {
      label: fr ? 'FINANCES' : 'FINANCES',
      items: [
        { href: '/invoices',  label: fr ? 'Factures' : 'Invoices',   icon: FileText },
        { href: '/deposits',  label: fr ? 'Acomptes' : 'Deposits',   icon: Wallet },
        { href: '/customers', label: fr ? 'Clients' : 'Customers',   icon: Users },
      ],
    },
    {
      label: fr ? 'EQUIPE' : 'TEAM',
      items: [
        { href: '/equipe',   label: fr ? 'Equipe' : 'Team',             icon: Users2 },
        ...(isModuleEnabled(orgModules, orgPlan, 'time_tracking') ? [{ href: '/feuilles-de-temps', label: fr ? 'Feuilles de temps' : 'Timesheets', icon: Clock }] : []),
        ...(isModuleEnabled(orgModules, orgPlan, 'recurring_contracts') ? [{ href: '/contrats', label: fr ? 'Contrats' : 'Contracts', icon: FileText }] : []),
      ],
    },
    {
      label: fr ? 'ANALYSE' : 'ANALYTICS',
      items: [
        { href: '/reports',    label: fr ? 'Rapports' : 'Reports',        icon: BarChart3 },
        { href: '/produits',   label: fr ? 'Produits' : 'Products',       icon: Package },
        { href: '/assistant',  label: fr ? 'Assistant IA' : 'AI Assistant', icon: Sparkles },
      ],
    },
  ]

  const bottomItems = [
    { href: '/settings',              label: fr ? 'Parametres' : 'Settings',            icon: Settings },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('organizations')
          .select('plan, enabled_modules')
          .eq('owner_user_id', data.user.id)
          .maybeSingle()
          .then(({ data: orgData }) => {
            if (orgData) {
              setOrgPlan(orgData.plan)
              setOrgModules((orgData.enabled_modules as Record<string, boolean>) || null)
            }
          })
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const allHrefs = [
    ...navSections.flatMap((s) => s.items.map((i) => i.href)),
    ...bottomItems.map((i) => i.href),
  ]

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (pathname.startsWith(href + '/')) {
      const moreSpecific = allHrefs.some(
        (h) => h !== href && h.startsWith(href + '/') && pathname.startsWith(h)
      )
      return !moreSpecific
    }
    return false
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
        <div className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
            <GestivioLogo />
            <span className="ml-1 rounded-full bg-indigo-50 dark:bg-indigo-950 px-1.5 py-px text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pro</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden -m-1.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navSections.map((section, sIdx) => (
            <div key={section.label}>
              {sIdx > 0 && <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-800" />}
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">
                {section.label}
              </p>
              <div className="space-y-px">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={[
                        'group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200',
                      ].join(' ')}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-indigo-500" />}
                      <Icon
                        className={[
                          'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
                          active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                        ].join(' ')}
                        strokeWidth={active ? 2 : 1.75}
                      />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Bottom: Settings */}
          <div>
            <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-800" />
            <div className="space-y-px">
              {bottomItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={[
                      'group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-indigo-500" />}
                    <Icon
                      className={[
                        'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
                        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                      ].join(' ')}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    {label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 px-3 py-3 pb-20 lg:pb-3">
          {user && (
            <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
                <span className="text-[11px] font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{fr ? 'Gestionnaire' : 'Manager'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {fr ? 'Se deconnecter' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  )
}
