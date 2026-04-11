'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, Search, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import Sidebar from './Sidebar'
import Link from 'next/link'
import { supabase } from '@/app/supabase'

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      fetchNotifications(data.user.id)
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

  const timeAgo = (date: string) => {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return 'just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -m-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 sm:text-xl truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative -m-1 p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
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
                  <div className="absolute right-0 top-full mt-2 z-30 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl slide-up overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
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

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                          <Bell className="h-8 w-8 text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                        </div>
                      ) : notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-indigo-50/40' : ''}`}
                        >
                          <div className="mt-0.5">{typeIcon[n.type] || typeIcon.info}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
