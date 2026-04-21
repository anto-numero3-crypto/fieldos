'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { Sparkles, Send, RotateCcw, Copy, Check, Zap } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Message { role: 'user' | 'assistant'; content: string }

function MessageContent({ content, fr }: { content: string; fr: boolean }) {
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
      if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-gray-900 dark:text-white mt-3 mb-1">{line.slice(3)}</h3>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-800 dark:text-gray-100">{line.slice(2, -2)}</p>
      if (line.startsWith('- ')) return <li key={i} className="ml-3 list-disc text-gray-700 dark:text-gray-200">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>
      if (line === '') return <br key={i} />
      return <p key={i} className="text-gray-700 dark:text-gray-200">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
    })

  return (
    <div className="relative group">
      <div className="text-sm leading-relaxed space-y-0.5">{rendered}</div>
      <button
        onClick={copyContent}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 h-7 w-7 inline-flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all shadow-sm"
        title={fr ? 'Copier le message' : 'Copy message'}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function AssistantPage() {
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const [user, setUser]     = useState<{ id: string; email?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.assistant.welcomeMsg },
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
      setMessages([...newMessages, { role: 'assistant', content: fr ? "Une erreur s'est produite. Veuillez réessayer." : 'An error occurred. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: t.assistant.welcomeMsg }])
  }

  const isOnlyWelcome = messages.length === 1

  return (
    <AppLayout title={fr ? 'Assistant IA' : 'AI Assistant'}>
      <div className="flex flex-col h-full max-h-[calc(100vh-64px)] bg-gray-50/50 dark:bg-gray-950">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">

            {/* Suggested prompts (only show on fresh conversation) */}
            {isOnlyWelcome && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> {fr ? 'Questions sugg\u00e9r\u00e9es' : 'Suggested questions'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {t.assistant.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-150 shadow-sm"
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50',
                ].join(' ')}>
                  {msg.role === 'user' ? (user?.email?.[0]?.toUpperCase() || 'U') : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={[
                  'max-w-[82%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-md shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30'
                    : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md shadow-sm',
                ].join(' ')}>
                  {msg.role === 'assistant' ? (
                    <MessageContent content={msg.content} fr={fr} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 chat-bubble">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-5 py-3.5 shadow-sm">
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="typing-dot h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2.5">
              <button
                type="button"
                onClick={resetConversation}
                className="shrink-0 mb-1.5 h-9 w-9 inline-flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={fr ? 'R\u00e9initialiser la conversation' : 'Reset conversation'}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder={fr ? "Posez n'importe quelle question sur votre activit\u00e9..." : 'Ask anything about your business...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                  className="block w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 pr-13 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm disabled:opacity-60 overflow-hidden"
                  style={{ minHeight: '52px', maxHeight: '128px' }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2.5 bottom-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-xs text-gray-400 dark:text-gray-500">
              {fr ? 'Propuls\u00e9 par ' : 'Powered by '}<span className="font-medium text-indigo-500 dark:text-indigo-400">Claude Sonnet</span> {fr ? '\u00b7 Acc\u00e8s en temps r\u00e9el \u00e0 vos donn\u00e9es \u00b7 Appuyez sur Entr\u00e9e pour envoyer' : '\u00b7 Real-time access to your data \u00b7 Press Enter to send'}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
