'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'
import { LayoutDashboard, Briefcase, Users, FileText, MoreHorizontal, X, BarChart3, Calendar, Settings, Sparkles, Globe, CreditCard, Lightbulb, Megaphone } from 'lucide-react'

const mainTabs = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
  { href: '/jobs',       icon: Briefcase,       label: 'Jobs' },
  { href: '/customers',  icon: Users,           label: 'Customers' },
  { href: '/invoices',   icon: FileText,        label: 'Invoices', badge: true },
]

const moreItems = [
  { href: '/schedule',            icon: Calendar,       label: 'Schedule' },
  { href: '/reports',             icon: BarChart3,      label: 'Reports' },
  { href: '/insights',            icon: Lightbulb,      label: 'AI Insights' },
  { href: '/customers/campaigns', icon: Megaphone,      label: 'Campaigns' },
  { href: '/assistant',           icon: Sparkles,       label: 'AI Assistant' },
  { href: '/book',                icon: Globe,          label: 'Booking Portal' },
  { href: '/settings',            icon: Settings,       label: 'Settings' },
  { href: '/billing',             icon: CreditCard,     label: 'Billing' },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [unpaidCount, setUnpaidCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user.id)
        .neq('status', 'paid')
        .then(({ count }) => setUnpaidCount(count || 0))
    })
  }, [])

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const anyMoreActive = moreItems.some((item) => isActive(item.href))

  return (
    <>
      {/* Slide-up "More" sheet */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 px-4 pt-4 pb-6 lg:hidden">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-gray-900">More</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : ''}`} strokeWidth={active ? 2.25 : 1.75} />
                    <span className="text-xs font-medium leading-none text-center">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-gray-100 bg-white lg:hidden">
        {mainTabs.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${active ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {badge && unpaidCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {unpaidCount > 99 ? '99+' : unpaidCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">{label}</span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-b-full bg-indigo-500" />}
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${anyMoreActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </nav>
    </>
  )
}
