'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X, Send, RotateCcw, Minimize2, Maximize2, ChevronDown } from 'lucide-react'
import { supabase } from '@/app/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const PAGE_CONTEXT: Record<string, string> = {
  '/dashboard': 'The user is viewing their main dashboard with KPIs, revenue chart, and recent activity.',
  '/customers': 'The user is managing their customer list.',
  '/jobs': 'The user is viewing and managing their service jobs.',
  '/invoices': 'The user is managing invoices and payments.',
  '/quotes': 'The user is managing quotes and estimates.',
  '/schedule': 'The user is viewing their job schedule and calendar.',
  '/team': 'The user is managing their team members.',
  '/reports': 'The user is viewing business analytics and reports.',
  '/settings': 'The user is in the settings section.',
  '/billing': 'The user is viewing their subscription and billing.',
}

const QUICK_PROMPTS = [
  'What\'s my revenue this month?',
  'Any overdue invoices?',
  'How many jobs today?',
  'Draft a payment reminder',
]

export default function FloatingAIChat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const pageContext = Object.entries(PAGE_CONTEXT).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] || 'The user is navigating the Gestivio platform.'

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    setInput('')
    setShowQuick(false)
    const newMsg: Message = { role: 'user', content }
    const history = [...messages, newMsg]
    setMessages(history)
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          userId,
          history: messages.slice(-8),
          pageContext,
          mode: 'floating',
        }),
      })
      const data = await res.json()
      setMessages([...history, { role: 'assistant', content: data.reply || 'Sorry, I could not process that.' }])
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Connection error. Please try again.' }])
    }
    setLoading(false)
  }, [input, messages, loading, userId, pageContext])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const reset = () => {
    setMessages([])
    setShowQuick(true)
    setInput('')
  }

  // Don't show on public pages
  if (!userId && !pathname.startsWith('/dashboard') && !pathname.startsWith('/customers') &&
      !pathname.startsWith('/jobs') && !pathname.startsWith('/invoices') && !pathname.startsWith('/quotes') &&
      !pathname.startsWith('/schedule') && !pathname.startsWith('/team') && !pathname.startsWith('/reports') &&
      !pathname.startsWith('/settings') && !pathname.startsWith('/billing') && !pathname.startsWith('/assistant')) {
    return null
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className={[
            'fixed z-50 flex flex-col bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300',
            expanded
              ? 'bottom-4 right-4 left-4 top-4 sm:left-auto sm:w-[480px] sm:top-4'
              : 'bottom-20 right-4 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-6rem)]',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Gestivio AI</p>
              <p className="text-xs text-indigo-200 truncate">{pageContext.split('.')[0]}</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={reset} title="New conversation" className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg mb-3">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Ask me anything</p>
                <p className="text-xs text-gray-500">I have full access to your business data and can help you manage customers, jobs, invoices, and more.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mt-1">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={[
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm',
                ].join(' ')}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mt-1">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {showQuick && messages.length === 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything about your business…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none max-h-24 leading-relaxed"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen(!open)}
        className={[
          'fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-105',
          open
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
        ].join(' ')}
        aria-label="Open AI assistant"
      >
        {open ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <>
            <Sparkles className="h-6 w-6 text-white" />
            {/* Pulse ring */}
            <span className="absolute inline-flex h-full w-full rounded-2xl bg-indigo-400 opacity-0 animate-ping" style={{ animationDuration: '3s' }} />
          </>
        )}
      </button>
    </>
  )
}
