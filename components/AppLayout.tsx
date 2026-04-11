'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, Sun, Moon, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import { useTheme } from './ThemeProvider'
import FloatingAIChat from './FloatingAIChat'
import CommandPalette from './CommandPalette'
import MobileTabBar from './MobileTabBar'

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

const typeIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />,
  error:   <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  info:    <Info className="h-4 w-4 text-blue-500 shrink-0" />,
}

export default function AppLayout({ children, title, actions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread]             = useState(0)
  const [userId, setUserId]             = useState<string | null>(null)
  const [cmdOpen, setCmdOpen]           = useState(false)
  const { theme, toggleTheme }          = useTheme()

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
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20))
          setUnread((n) => n + 1)
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
    if (secs < 60) return 'just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
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
              <span className="truncate">Search or command…</span>
              <kbd className="ml-auto shrink-0 hidden md:flex items-center gap-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">⌘K</kbd>
            </button>

            {title && (
              <h1 className="sm:hidden text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {actions && <div className="flex items-center gap-2">{actions}</div>}

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
                className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell className="h-4.5 w-4.5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-30 w-80 rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unread > 0 && <p className="text-xs text-gray-400">{unread} unread</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                          <Bell className="h-8 w-8 text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                          <p className="text-xs text-gray-300 mt-1">You&apos;ll see alerts here when things happen</p>
                        </div>
                      ) : notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { markOneRead(n.id); if (n.link) window.location.href = n.link }}
                          className={`w-full flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''}`}
                        >
                          <div className="mt-0.5">{typeIcon[n.type] || typeIcon.info}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                            {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                        </button>
                      ))}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                          View all notifications →
                        </Link>
                      </div>
                    )}
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
          {children}
        </main>
      </div>

      {/* Floating AI Chat — available on every page */}
      <FloatingAIChat />

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  )
}
