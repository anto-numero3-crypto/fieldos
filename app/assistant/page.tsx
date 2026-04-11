'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { Sparkles, Send, RotateCcw, Copy, Check, Zap } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTED_PROMPTS = [
  'What is my total revenue this month?',
  'Which customers have overdue invoices?',
  'Draft a payment reminder email for overdue invoices',
  'Summarize my business performance this week',
  'Which customers haven\'t had a job in 90+ days?',
  'What are my most profitable job types?',
  'How many active jobs do I have right now?',
  'Generate a weekly business summary',
]

function MessageContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const copyContent = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple markdown-like rendering
  const rendered = content
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-gray-900 mt-2 mb-1">{line.slice(3)}</h3>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>
      if (line.startsWith('- ')) return <li key={i} className="ml-3 list-disc">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>
      if (line === '') return <br key={i} />
      return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
    })

  return (
    <div className="relative group">
      <div className="text-sm leading-relaxed space-y-0.5">{rendered}</div>
      <button
        onClick={copyContent}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 rounded-lg p-1 bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
        title="Copy message"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function AssistantPage() {
  const [user, setUser]     = useState<{ id: string; email?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Gestivio AI assistant, powered by Claude.\n\nI have real-time access to all your business data — customers, jobs, invoices, quotes, and revenue analytics.\n\nAsk me anything, or let me draft something for you!" },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef        = useRef<HTMLDivElement>(null)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading || !user) return

    const newUserMsg: Message = { role: 'user', content: messageText }
    const newMessages = [...messages, newUserMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Build history (exclude the welcome message)
    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, userId: user.id, history }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: "Hi! I'm your Gestivio AI assistant, powered by Claude.\n\nI have real-time access to all your business data — customers, jobs, invoices, quotes, and revenue analytics.\n\nAsk me anything, or let me draft something for you!" }])
  }

  const isOnlyWelcome = messages.length === 1

  return (
    <AppLayout title="AI Assistant">
      <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">

            {/* Suggested prompts (only show on fresh conversation) */}
            {isOnlyWelcome && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> Suggested questions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="text-left rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-150 shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 chat-bubble ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 select-none',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-200',
                ].join(' ')}>
                  {msg.role === 'user' ? (user?.email?.[0]?.toUpperCase() || 'U') : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={[
                  'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md',
                ].join(' ')}>
                  {msg.role === 'assistant' ? (
                    <MessageContent content={msg.content} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
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

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={resetConversation}
                className="shrink-0 mb-1 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask anything about your business..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                  className="block w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm disabled:opacity-60 overflow-hidden"
                  style={{ minHeight: '48px', maxHeight: '128px' }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              Powered by <span className="font-medium text-indigo-500">Claude Sonnet</span> · Real-time access to your business data · Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
