'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { Sparkles, Send, RotateCcw } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

export default function AssistantPage() {
  const { t } = useLanguage()
  const l = t.assistant

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: l.welcomeMsg },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: l.welcomeMsg }]
      }
      return prev
    })
  }, [l.welcomeMsg])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading || !user) return

    setMessages((prev) => [...prev, { role: 'user', content: messageText }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, userId: user.id }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: l.welcomeMsg }])
  }

  return (
    <AppLayout title={l.title}>
      <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                {l.prompts.map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)} disabled={loading} className="text-left rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 shadow-sm">
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 chat-bubble ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5', msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-200'].join(' ')}>
                  {msg.role === 'user' ? (user?.email?.[0]?.toUpperCase() || 'U') : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={['max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm', msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md'].join(' ')} style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 chat-bubble">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-200">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2">
              <button type="button" onClick={resetConversation} className="shrink-0 mb-1 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title={l.resetTooltip}>
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  placeholder={l.inputPlaceholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                  className="block w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm max-h-32 disabled:opacity-60"
                  style={{ minHeight: '48px' }}
                />
                <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()} className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">{l.poweredBy}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
