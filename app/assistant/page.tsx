'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AssistantPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hi! I am your FieldOS Assistant. Ask me anything about your business — customers, jobs, invoices, or revenue.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)
    }
    init()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId: user.id }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>AI Assistant</h1>
        <a href="/dashboard" style={{ color: '#000' }}>← Back to Dashboard</a>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#000' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#000',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#f5f5f5', color: '#666', fontSize: '14px' }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', gap: '12px' }}>
          <input
            placeholder="Ask anything about your business..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Try asking:</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            'How many customers do I have?',
            'What are my unpaid invoices?',
            'Summarize my jobs',
            'What is my total revenue?'
          ].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #eee', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}