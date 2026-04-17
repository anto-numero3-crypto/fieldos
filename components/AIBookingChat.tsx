'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIBookingChatProps {
  orgSlug: string
  orgName: string
  agentName: string
  agentGreeting?: string
  onSwitchToForm?: () => void
}

export default function AIBookingChat({
  orgSlug,
  orgName,
  agentName,
  agentGreeting,
  onSwitchToForm,
}: AIBookingChatProps) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const defaultGreeting = fr
    ? `Bonjour ! Je suis ${agentName}, l'assistant de réservation de ${orgName}. Comment puis-je vous aider ?`
    : `Hello! I'm ${agentName}, the booking assistant for ${orgName}. How can I help you?`

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: agentGreeting || defaultGreeting,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingDone, setBookingDone] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading || bookingDone) return

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const historyForApi = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/booking/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyForApi,
          orgSlug,
        }),
      })

      const data = await res.json()

      if (data.error === 'ai_limit_reached') {
        setLimitReached(true)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fr
              ? 'Le service de chat IA a atteint sa limite mensuelle. Veuillez utiliser le formulaire de réservation.'
              : 'The AI chat service has reached its monthly limit. Please use the booking form.',
            timestamp: new Date(),
          },
        ])
      } else if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, timestamp: new Date() },
        ])

        if (data.bookingCreated) {
          setBookingDone(true)
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fr
              ? 'Désolé, une erreur est survenue. Veuillez réessayer.'
              : 'Sorry, an error occurred. Please try again.',
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fr
            ? 'Désolé, une erreur de connexion est survenue. Veuillez réessayer.'
            : 'Sorry, a connection error occurred. Please try again.',
          timestamp: new Date(),
        },
      ])
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(fr ? 'fr-CA' : 'en-CA', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const agentInitial = agentName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
          {agentInitial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {agentName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fr ? 'Assistant IA' : 'AI Assistant'}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
          {fr ? 'En ligne' : 'Online'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ maxHeight: '500px', minHeight: '320px' }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0 mb-1">
                  {agentInitial}
                </div>
              )}
              <div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[10px] mt-1 text-gray-400 dark:text-gray-500 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {fmtTime(msg.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Booking confirmed card */}
        {bookingDone && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[85%]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0 mb-1">
                {agentInitial}
              </div>
              <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {fr ? 'Réservation confirmée !' : 'Booking confirmed!'}
                  </p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {fr
                    ? 'Vous recevrez un courriel de confirmation sous peu.'
                    : 'You will receive a confirmation email shortly.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0 mb-1">
                {agentInitial}
              </div>
              <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        {bookingDone || limitReached ? (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
            {bookingDone
              ? (fr ? 'Conversation terminée — votre réservation est confirmée.' : 'Conversation ended — your booking is confirmed.')
              : (fr ? 'Limite de messages atteinte.' : 'Message limit reached.')}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={fr ? 'Tapez votre message...' : 'Type your message...'}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0"
              aria-label={fr ? 'Envoyer' : 'Send'}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Switch to form link */}
        {onSwitchToForm && !bookingDone && (
          <button
            onClick={onSwitchToForm}
            className="mt-2 w-full text-center text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {fr ? 'Préférez-vous remplir un formulaire ?' : 'Prefer to fill a form?'}
          </button>
        )}
      </div>
    </div>
  )
}
