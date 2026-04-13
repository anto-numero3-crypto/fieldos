'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, Sun, Moon, Search, Calendar, DollarSign, UserPlus, Briefcase, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Sidebar from './Sidebar'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import { useTheme } from './ThemeProvider'
import { useLanguage } from '@/lib/LanguageContext'
import FloatingAIChat from './FloatingAIChat'
import CommandPalette from './CommandPalette'
import MobileTabBar from './MobileTabBar'
import KeyboardShortcuts from './KeyboardShortcuts'
import TrialBanner from './TrialBanner'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  actions?: React.ReactNode
}

interface Notification {
  id: string
  title: string
  body?: string
  type: string
  read: boolean
  link?: string
  created_at: string
}

// Type-specific icon mapping. Falls back to generic by severity if the type
// isn't recognized. Each cell renders an icon in a colored circle.
const TYPE_ICON: Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }> = {
  booking_request:   { Icon: Calendar,    bg: 'bg-amber-50',   fg: 'text-amber-600' },
  booking_confirmed: { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  invoice_paid:      { Icon: DollarSign,  bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  invoice_overdue:   { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600' },
  new_customer:      { Icon: UserPlus,    bg: 'bg-blue-50',    fg: 'text-blue-600' },
  job_completed:     { Icon: Briefcase,   bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  payment_failed:    { Icon: XCircle,     bg: 'bg-red-50',     fg: 'text-red-600' },
  trial_ending:      { Icon: Clock,       bg: 'bg-orange-50',  fg: 'text-orange-600' },
  // Generic fallbacks (legacy)
  success:           { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  error:             { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600' },
  warning:           { Icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600' },
  info:              { Icon: Info,        bg: 'bg-blue-50',    fg: 'text-blue-600' },
}
function notifIcon(type: string) {
  return TYPE_ICON[type] || TYPE_ICON.info
}

export default function AppLayout({ children, title, actions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread]             = useState(0)
  const [userId, setUserId]             = useState<string | null>(null)
  const [cmdOpen, setCmdOpen]           = useState(false)
  const { theme, toggleTheme }          = useTheme()
  const { lang, setLang }               = useLanguage()

  // Keep browser tab title in sync
  useEffect(() => {
    if (title) document.title = `${title} — Gestivio`
  }, [title])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      fetchNotifications(data.user.id)

      // Real-time notification updates
      const channel = supabase
        .channel('notif-badge')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${data.user.id}`,
        }, (payload) => {
          const n = payload.new as Notification
          setNotifications((prev) => [n, ...prev].slice(0, 20))
          setUnread((u) => u + 1)
          // Brief preview toast — clicking it navigates to the linked page.
          if (n.title) {
            toast(n.title, {
              description: n.body,
              action: n.link ? { label: 'Voir', onClick: () => { window.location.href = n.link! } } : undefined,
            })
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  }, [])

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
    setUnread((data || []).filter((n: Notification) => !n.read).length)
  }

  const markAllRead = async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((n) => Math.max(0, n - 1))
  }

  const timeAgo = (date: string) => {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return "à l'instant"
    if (secs < 3600) return `il y a ${Math.floor(secs / 60)} min`
    if (secs < 86400) return `il y a ${Math.floor(secs / 3600)} h`
    return `il y a ${Math.floor(secs / 86400)} j`
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <CommandPalette />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -m-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search / command palette trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-0 flex-1 max-w-64"
              onKeyDown={(e) => { if (e.key === 'Enter') setCmdOpen(true) }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Rechercher ou commande…</span>
              <kbd className="ml-auto shrink-0 hidden md:flex items-center gap-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">⌘K</kbd>
            </button>

            {title && (
              <h1 className="sm:hidden text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {actions && <div className="flex items-center gap-2 hidden sm:flex">{actions}</div>}

            {/* Language switcher — visible on all screen sizes */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
              <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>FR</button>
            </div>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell className="h-4.5 w-4.5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 tabular-nums">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-30 w-[380px] max-w-[calc(100vw-1rem)] rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unread > 0 && <p className="text-xs text-gray-400">{unread} non lue{unread > 1 ? 's' : ''}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            Tout marquer comme lu
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} aria-label="Fermer" className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                            <Bell className="h-6 w-6 text-indigo-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">Aucune notification</p>
                          <p className="text-xs text-gray-400 mt-1">Les alertes apparaîtront ici</p>
                        </div>
                      ) : notifications.map((n) => {
                        const cfg = notifIcon(n.type)
                        return (
                          <button
                            key={n.id}
                            onClick={() => { markOneRead(n.id); if (n.link) window.location.href = n.link }}
                            className={`w-full flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''}`}
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                              <cfg.Icon className={`h-4 w-4 ${cfg.fg}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                              {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-center">
                      <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        Voir toutes les notifications →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page title bar (desktop) */}
        {title && (
          <div className="hidden sm:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-16 lg:pb-0">
          <TrialBanner />
          {children}
        </main>
      </div>

      {/* Floating AI Chat — available on every page */}
      <FloatingAIChat />

      {/* Mobile bottom tab bar */}
      <MobileTabBar />

      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts />
    </div>
  )
}
